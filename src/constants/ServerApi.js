import * as MyUtil from "./MyUtil";

export async function _webRtcReq(reqMethods,data) {
    return await MyUtil._webRtcReq(reqMethods,data);
}

export async function _xirsysCert() {
    return await MyUtil._xirsysReq();
}
