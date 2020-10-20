## RN webRTC demo with apprtc and xirsys

- SIGNAL Server : appr.tc

- STUN/TURN Server : xirtsys



## Getting started

Install

```
yarn install
cd ios && pod install
```

- IOS (RN > 60 => 퍼미션만 주면 됨.)

  https://github.com/react-native-webrtc/react-native-webrtc/blob/master/Documentation/iOSInstallation.md

- AOS (RN > 60 => 퍼미션만 주면 됨.)

  https://github.com/react-native-webrtc/react-native-webrtc/blob/master/Documentation/AndroidInstallation.md

  - minSdkVersion = 24

 

## Auth

> src/constants/Config.js

`XIRSYS_AUTH` 발급받은 키 입력 