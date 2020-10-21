import React from 'react';
import { StyleSheet, SafeAreaView, Text, View, Image, TouchableOpacity, TextInput, Alert, } from 'react-native';
import { RTCPeerConnection, RTCMediaStream, RTCIceCandidate, RTCSessionDescription, RTCView, MediaStreamTrack, mediaDevices, getUserMedia, } from 'react-native-webrtc';
import WebSocketClient from 'reconnecting-websocket'
import Layout from "./constants/Layout";
import * as MyUtil from "./constants/MyUtil";
import * as ServerApi from "./constants/ServerApi";


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPermitted: true,
      ice_connection_state: '',
      configuration: {
        iceServers: [{
          username: "",
          credential: "",
          urls: [
            "stun:tk-turn2.xirsys.com",
            "turn:tk-turn2.xirsys.com:80?transport=udp",
            "turn:tk-turn2.xirsys.com:3478?transport=udp",
            "turn:tk-turn2.xirsys.com:80?transport=tcp",
            "turn:tk-turn2.xirsys.com:3478?transport=tcp",
            "turns:tk-turn2.xirsys.com:443?transport=tcp",
            "turns:tk-turn2.xirsys.com:5349?transport=tcp"
          ]
        }],
        // iceTransportPolicy :"relay" // 제거하거나 "all"로 설정하여 강제 실행을 중지합니다.
      },
      localStreamURL: null,
      remoteStreamURL: null,
      clientId: null,
      roomId: "4548714_137_",
      mRoomData: null,
      isFront: true
    }

    this.peer = null;
    this.ws = null;
  }

  async componentDidMount() {
    let { configuration } = this.state;
    if (!(await MyUtil._checkCameraPermission())) {
      return Alert.alert("", "설정에서 카메라, 메모리 읽기/쓰기 권한을 허용해주세요!");
    }

    let result = await ServerApi._xirsysCert();
    configuration.iceServers[0].username = result.DATA_RESULT.v.iceServers.username;
    configuration.iceServers[0].credential = result.DATA_RESULT.v.iceServers.credential;

    let newConfig = configuration;
    this.setState({ configuration: newConfig })
  }

  _sendSocketMsg = async (jsonData) => {
    const { ws } = this;
    console.log("_sendSocketMsg()")
    // console.log("_sendSocketMsg ws - : " + JSON.stringify(ws.readyState));
    // console.log("_sendSocketMsg data - : " + JSON.stringify(jsonData));
    ws.send(JSON.stringify(jsonData))
  };


  _leaveRoom = async () => {
    const { ws, peer } = this;
    await ServerApi._webRtcReq(`leave/${this.state.roomId}/${this.state.mRoomData.client_id}`, {});

    if (ws && ws.readyState === 1) { ws.close(); }
    if (peer) { peer.close(); }

    this.setState({ isConnected: false, remoteStreamURL: null });
  }


  _joinRoom = async () => {
    console.log("_joinRoom() >>> ");

    const result = await ServerApi._webRtcReq('join/' + this.state.roomId, {});
    if (result.IS_SUCCESS === true) {
      this.setState({ mRoomData: result.DATA_RESULT.params });

      console.log("mRoomData: " + JSON.stringify(this.state.mRoomData));

      if (result.DATA_RESULT.result === "FULL") {
        return Alert.alert("", "방에 접속할 수 없습니다! (FULL)")
      }

      this._connectAppRTC(this.state.mRoomData.wss_url);
    } else {
      Alert.alert("", "_joinRoom ERROR")
    }
  }

  _connectAppRTC = (host) => {
    console.log("_connectAppRTC() >>> host:" + host);

    // Setup Socket
    const ws = new WebSocketClient(host);
    this.ws = ws;

    ws.onopen = () => {
      console.info('Socket Connected!')
      this.setState({ isConnected: true })

      this._sendSocketMsg({ cmd: "register", roomid: this.state.mRoomData.room_id, clientid: this.state.mRoomData.client_id })

      if (this.state.mRoomData.is_initiator === "true") {
        this._handleConnect();
      } else {
        this._handleAnswer();
      }
    };

    ws.onmessage = async ({ data }) => {
      this.setState({ isConnected: true });
      let msg = JSON.parse(data);

      if (msg.msg.length > 0) {
        msg = JSON.parse(msg.msg);
        if (msg) {
          if (msg.type === 'offer') {
            await this._handleAnswer();

          } else if (msg.type === 'answer') {
            await this.peer.setRemoteDescription(new RTCSessionDescription(msg))

          } else if (msg.type === 'candidate') {
            const candidate = { sdpMLineIndex: msg.sdpMLineIndex, sdpMid: msg.sdpMid, candidate: msg.candidate };
            if (this.peer) { this.peer.addIceCandidate(new RTCIceCandidate(candidate)); }

          } else if (msg.type === 'bye') {
            this._onDisconnedted()
          } else {
            console.log('Unknown message:' + msg)
          }
        }
      } else {
        console.log('Invalid message:' + msg)
      }
    };

    ws.onerror = error => {
      Alert.alert("", "WS 통신 ERROR : " + error.message)
      this.setState({ isConnected: false })
    };

    ws.onclose = error => {
      this.setState({ isConnected: false })
      this._leaveRoom();
    };

    this._getLocalStream();
  }

  _getLocalStream = () => {
    const { localStreamURL } = this.state;
    let videoSourceId;

    if (!localStreamURL) {
      mediaDevices.enumerateDevices().then((sourceInfos) => {
        for (let i = 0; i < sourceInfos.length; i++) {
          const sourceInfo = sourceInfos[i];

          if (sourceInfo.kind == "videoinput" && sourceInfo.facing == (this.state.isFront ? "front" : "back")) {
            videoSourceId = sourceInfo.deviceId;
          }
        }
        mediaDevices.getUserMedia({
          audio: true,
          video: {
            mandatory: {
              minWidth: Layout.window.width,
              minHeight: Layout.window.height,
              minFrameRate: 30
            },
            facingMode: (this.state.isFront ? "user" : "environment"),
            optional: (videoSourceId ? [{ sourceId: videoSourceId }] : [])
          }
        }).then(stream => {
          if (!MyUtil._isNull(stream)) {
            this.setState({ localStreamURL: stream.toURL() })
            this.localStream = stream
          }

        }).catch(error => {
          Alert.alert("", "getUserMedia ERROR : " + JSON.stringify(error))
        });
      });
    }
  }


  _setupWebRTC = async () => {
    const peer = new RTCPeerConnection(this.state.configuration);

    peer.onremovestream = (event) => { console.log("onremovestream : " + event) };
    peer.onnegotiationneeded = (event) => { console.log("onnegotiationneeded : " + event) };
    peer.oniceconnectionstatechange = (event) => {
      this.setState({ ice_connection_state: event.target.iceConnectionState })

      switch (event.target.iceConnectionState) {
        case 'completed':
          break;
        case 'connected':
          break;
        case 'closed':
          this._leaveRoom();
          break;
        case 'disconnected':
          this._onDisconnedted();
          break;
        case 'failed':
          if (this.peer) {
            this.peer.close()
            this.setState({ remoteStreamURL: null })
            this.remoteStream = null
          }
          break
      }
    };
    peer.onaddstream = (event) => {
      this.setState({ remoteStreamURL: event.stream.toURL() })
      this.remoteStream = event.stream
    };
    peer.onicecandidate = async ({ candidate }) => {
      console.log("peer.onicecandidate ()")
      if (!candidate) return;

      const jsonIceCandidate = { type: "candidate", sdpMLineIndex: candidate.sdpMLineIndex, sdpMid: candidate.sdpMid, candidate: candidate.candidate };
      if (this.state.mRoomData.is_initiator === 'true') {
        const result = await ServerApi._webRtcReq(`message/${this.state.roomId}/${this.state.mRoomData.client_id}`, jsonIceCandidate);
      } else {
        this._sendSocketMsg(jsonIceCandidate);
      }
    };
    peer.addStream(this.localStream);
    this.peer = peer;
  }

  _handleConnect = async () => {
    await this._setupWebRTC()
    const { peer } = this

    try {
      const offer = await peer.createOffer()
      this.offer = offer
      await peer.setLocalDescription(offer)

      const result = await ServerApi._webRtcReq(`message/${this.state.roomId}/${this.state.mRoomData.client_id}`, { type: 'offer', sdp: this.peer.localDescription.sdp });

    } catch (error) {
      Alert.alert("", "_handleConnect ERROR : " + error.message)
      return
    }
  }

  _onDisconnedted = () => {
    Alert.alert("", "종료 되었습니다.", [{
      text: '확인', onPress: async () => {
        await this._leaveRoom();
      }
    },], { cancelable: false });
  }

  _handleAnswer = async () => {
    console.log("_handleAnswer ()")
    const messages = this.state.mRoomData.messages;
    let offer = null;

    messages.forEach((msg) => {
      const msgObj = JSON.parse(msg);
      if (msgObj.type === 'offer') { offer = msgObj; }
    });

    await this._setupWebRTC()

    this.peer.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
      messages.forEach((msg) => {
        const msgObj = JSON.parse(msg);
        if (msgObj.type === 'candidate') {
          this.peer.addIceCandidate(new RTCIceCandidate({ sdpMLineIndex: msgObj.sdpMLineIndex, sdpMid: msgObj.sdpMid, candidate: msgObj.candidate }))
        }
      });

      this.peer.createAnswer().then((localDescription) => {
        this.peer.setLocalDescription(localDescription).then(() => {

          this._sendSocketMsg({
            cmd: "send",
            msg: JSON.stringify({ type: 'answer', sdp: this.peer.localDescription.sdp })
          })
        }).catch((error) => { console.log("_handleAnswer ERROR : " + error) })
      }).catch((error) => { console.log("_handleAnswer ERROR : " + error) })
    }).catch((error) => { console.log("_handleAnswer ERROR : " + error) })
  }

  _confirmDisconnect = () => {
    this._handleDisconnect();
  }


  _handleDisconnect = () => {
    if (this.peer) {
      this.peer.close()
      this._leaveRoom();
      const { ws } = this;
      if (ws && ws.readyState === 1) {
        ws.close();
      }
    }
  }


  render() {
    return (
      <SafeAreaView style={styles.container} >

        {
          !this.state.isConnected && (
            <View style={{ width: Layout.window.width, height: 100 }}>
              <View style={{ flexDirection: "row" }} >
                <View style={{ flex: 1, flexDirection: "row", width: "100%", justifyContent: "flex-start", alignItems: "center", borderWidth: 1, borderColor: "lightgray" }} >
                  <Text style={{ flex: 1, textAlign: "right", }} >Room Id:</Text>
                  <TextInput
                    style={{ flex: 2, height: 30, backgroundColor: "white", padding: 5 }} value={this.state.roomId}
                    onChangeText={(text) => this.setState({ roomId: text })}
                  ></TextInput>
                </View>
              </View>
              <TouchableOpacity style={styles.buttonView} onPress={this._joinRoom} >
                <Text style={styles.buttonText}>Join Room</Text>
              </TouchableOpacity>
            </View>
          )
        }

        <View style={styles.video}>
          <RTCView streamURL={this.state.remoteStreamURL} objectFit="cover" zOrder={0} style={{ flex: 1, }} />
          <RTCView streamURL={this.state.localStreamURL} objectFit="contain" zOrder={1} style={{ height: 150, width: 150, position: 'absolute', right: 0, bottom: 10, }} />
        </View>

        <View style={styles.btnCircle}>
          <TouchableOpacity onPress={this._confirmDisconnect}>
            <Image
              source={require("./img/btn_call_no.png")}
              style={{ height: 70, width: 70, }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'gray'
  },
  video: {
    flex: 1,
    backgroundColor: 'white',
    width: Layout.window.width,
  },
  buttonView: {
    flex: 1, height: 40, width: Layout.window.width, flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: "white"
  },
  btnCircle: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 100,
    width: Layout.window.width,
    left: 0,
    bottom: 60
  }
});

export default App;
