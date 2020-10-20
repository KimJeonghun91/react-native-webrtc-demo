import axios from "axios";
import { Alert, Platform,  PermissionsAndroid } from "react-native";
import Config from "./Config";
window.btoa = require('Base64').btoa;



export async function _xirsysReq() {
    let result = "";
    _consoleLog("============ >>>>>> " + `_xirsysReq 요청`);

    try {
        let response = await axios({
            method: 'PUT',
            url: Config.XIRSYS_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "Basic " + btoa(Config.XIRSYS_AUTH)
            },
            data: JSON.stringify({ "format": "urls" })
        });

        let responseOK = response && response.status === 200;
        if (responseOK) {
            result = response.data;
            _consoleLog("============ <<<<<< " + "_xirsysReq() 정상 result : " + JSON.stringify(result));

            return {
                IS_SUCCESS: true,
                DATA_RESULT: result
            };

        } else {
            result = response.error;
            _consoleLog("============ <<<<<< " + "_xirsysReq() 응답 status error : " + result);
            Alert.alert("", `네트워크 환경이 불안정합니다. 앱을 재시작해주세요.\n\n_xirsysReq\n(${result})`);

            return {
                IS_SUCCESS: false,
                DATA_RESULT: result
            };
        }


    } catch (error) {
        _consoleLog("============ <<<<<< _xirsysReq " + "() 네트워크 error : " + error);
        Alert.alert("", `네트워크 환경이 불안정합니다. 앱을 재시작해주세요.\n\n_xirsysReq\n(${error.message})`);

        return {
            IS_SUCCESS: false,
            DATA_RESULT: error
        };
    }
}


export async function _webRtcReq(methodName, data) {
    let result = "";
    let url = Config.WEB_RTC_URL + methodName;

    _consoleLog("============ >>>>>> " + url + ` (${JSON.stringify(data)}) 요청`);

    try {
        let response = await axios({
            method: 'post',
            url: url,
            headers: { 'Content-Type': 'application/json' },
            data: data
        });

        let responseOK = response && response.status === 200;
        if (responseOK) {
            result = response.data;
            _consoleLog("============ <<<<<< " + methodName + "() 정상 result : " + JSON.stringify(result));

            return {
                IS_SUCCESS: true,
                DATA_RESULT: result
            };

        } else {
            result = response.error;
            _consoleLog("============ <<<<<< " + methodName + "() 응답 status error : " + result);
            Alert.alert("", `네트워크 환경이 불안정합니다. 앱을 재시작해주세요.\n\n${methodName}\n(${result})`);

            return {
                IS_SUCCESS: false,
                DATA_RESULT: result
            };
        }


    } catch (error) {
        _consoleLog("============ <<<<<< " + methodName + "() 네트워크 error : " + error);
        Alert.alert("", `네트워크 환경이 불안정합니다. 앱을 재시작해주세요.\n\n${methodName}\n(${error.message})`);

        return {
            IS_SUCCESS: false,
            DATA_RESULT: error
        };
    }
}

export async function _httpReq(methodName, data) {
    let result = "";
    let url = Config.API_URL + methodName;

    _consoleLog("============ >>>>>> " + url + " () 요청 - " + JSON.stringify(data));

    try {
        let response = await axios({
            method: 'post',
            url: url,
            headers: { 'Content-Type': 'application/json' },
            data: data
        });

        let responseOK = response && response.status === 200;
        if (responseOK) {
            result = response.data;
            _consoleLog("============ <<<<<< " + methodName + "() 정상 result : " + JSON.stringify(result));

            return {
                IS_SUCCESS: true,
                DATA_RESULT: result
            };

        } else {
            result = response.error;
            _consoleLog("============ <<<<<< " + methodName + "() 응답 status error : " + result);
            Alert.alert("", `네트워크 환경이 불안정합니다. 앱을 재시작해주세요.\n\n${methodName}\n(${result})`);

            return {
                IS_SUCCESS: false,
                DATA_RESULT: result
            };
        }


    } catch (error) {
        _consoleLog("============ <<<<<< " + methodName + "() 네트워크 error : " + error);
        Alert.alert("", `네트워크 환경이 불안정합니다. 앱을 재시작해주세요.\n\n${methodName}\n(${error.message})`);

        return {
            IS_SUCCESS: false,
            DATA_RESULT: error
        };
    }
}



export async function _httpGetReq(reqURL) {
    let result = "";

    _consoleLog("============ >>>>>> " + reqURL + " () 요청 - ");

    try {
        let response = await axios({
            method: 'get',
            url: reqURL,
        });

        let responseOK = response && response.status === 200;
        if (responseOK) {
            result = response.data;
            _consoleLog("============ <<<<<< " + "() 정상 result : " + JSON.stringify(result));

            return {
                IS_SUCCESS: true,
                DATA_RESULT: result
            };

        } else {
            result = response.error;
            _consoleLog("============ <<<<<< " + "() 응답 status error : " + result);
            Alert.alert("", `네트워크 환경이 불안정합니다. 앱을 재시작해주세요.\n\n(${result})`);

            return {
                IS_SUCCESS: false,
                DATA_RESULT: result
            };
        }


    } catch (error) {
        _consoleLog("============ <<<<<< " + "() 네트워크 error : " + error);
        Alert.alert("", `네트워크 환경이 불안정합니다. 앱을 재시작해주세요.\n\n(${error.message})`);

        return {
            IS_SUCCESS: false,
            DATA_RESULT: error
        };
    }
}





export async function _multiPartReq(methodName, formData) {
    let result = { "result": true };
    let url = Config.API_URL + methodName;

    _consoleLog("============ >>>>>> " + methodName + " () 요청 - " + JSON.stringify(formData));

    let response = await axios({
        method: 'post',
        url: url,
        headers: { 'content-type': 'multipart/form-data' },
        data: formData
    });

    let responseOK = response && response.status === 200;
    if (responseOK) {
        result = response.data;
        _consoleLog("============ <<<<<< () 정상 result : " + JSON.stringify(result));

        return {
            IS_SUCCESS: true,
            DATA_RESULT: result
        };

    } else {
        result = response.error;
        _consoleLog("============ <<<<<< () 응답 status error : " + result);
        return {
            IS_SUCCESS: false,
            DATA_RESULT: result
        };
    }
}




export function _isNull(obj) {
    if (typeof (obj) === 'undefined') {
        return true
    } else if (obj === "undefined") {
        return true
    } else if (obj === null) {
        return true
    } else if (obj === "null") {
        return true
    } else if (obj === "") {
        return true
    } else if (obj.length === 0) {
        return true
    } else if (obj.length === "0.0") {
        return true
    } else {
        return false
    }
}

export function _consoleLog(text) {
    if (Config.IS_LOG) {
        console.log("** (myLog) ** \n" + text);
    }
}

export function _consoleError(text) {
    if (Config.IS_LOG) {
        console.error("** (myLog) ** \n" + text);
    }
}

export async function _checkCameraPermission() {
    if (Platform.OS === 'android') {
        let status = "";

        status = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        ]);

        const cameraGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        const readGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        const writeGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)

        if (cameraGranted && readGranted && writeGranted) {
            return true
        } else {
            return false;
        }

    } else {
        return true;
    }
}