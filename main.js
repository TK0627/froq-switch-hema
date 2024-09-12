"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs = __importStar(require("fs"));
async function jobArrived(s, flowElement, job) {
    const getAuthToken = async () => {
        const url = 'https://auth-int.hema.digital/token';
        const body = new URLSearchParams({
            client_id: 'preprod-package-specs',
            client_secret: 'hcs_Q8j1kUjpPZlmX686mO0ZG8p1veUAcfprznOF',
            grant_type: 'client_credentials',
        });
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        };
        try {
            const response = await (0, node_fetch_1.default)(url, options);
            return await response.json();
        }
        catch (error) {
            console.error('Error:', error);
        }
    };
    const getBrands = async () => {
        const url = 'https://acc.business-preprod.hema.digital/dam-engine/api/v4/media';
        const tokenData = await getAuthToken().then(r => r);
        const token = tokenData === null || tokenData === void 0 ? void 0 : tokenData.access_token;
        const debugLog = await flowElement.getPropertyStringValue('debug');
        if (debugLog == 'Yes')
            await job.log(LogLevel.Debug, 'Hema-New' + "token: %1", [token]);
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        };
        try {
            const response = await (0, node_fetch_1.default)(url, options);
            return await response.json();
        }
        catch (error) {
            console.error('Error:', error);
        }
    };
    const uploadFile = async () => {
        const baseURL = 'https://acc.business-preprod.hema.digital/dam-engine/api/v4/media';
        const jobName = await job.getName(true);
        const jobPath = await job.get(AccessLevel.ReadOnly);
        //const metaPropertiesObject = {"metaproperty.30379270-3D30-41F0-A0F97BEBB33903D7": "13D566BE-1739-4531-A3866EB6C72D28D0","metaproperty.67451A63-2D23-4D8F-B19E278371DDDA39": "9477A674-AA5C-4D2E-AD9FD8DC2FB548AD","metaproperty.33DFD186-D235-4D86-99C9696AEABEE104": "81FBC06F-B092-4777-961E544FC2841D75"}
        const metaproperties = await flowElement.getPropertyStringValue('metaproperties');
        const metapropertiesObject = JSON.parse(metaproperties);
        const additionalMetaPropertiesObject = {
            "property_ProductAsset": ["Yes"],
            "property_ContentCategory": ["ProductAttachment"],
            "property_ProductAttachment": ["Packaging"],
            "isPublic": 1,
        };
        const formData = new FormData();
        const fileContents = fs.readFileSync(`${jobPath}/${jobName}`);
        const file = new Blob([fileContents], { type: 'text/plain' });
        formData.append('fileContents', file, jobName);
        const debugLog = await flowElement.getPropertyStringValue('debug');
        if (debugLog == 'Yes')
            await job.log(LogLevel.Debug, 'Hema-New' + "formData: %1", [formData.entries.name]);
        const brands = await getBrands().then(r => r);
        const body = new URLSearchParams({
            client_id: 'preprod-package-specs',
            client_secret: 'hcs_Q8j1kUjpPZlmX686mO0ZG8p1veUAcfprznOF',
            grant_type: 'client_credentials',
        });
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', },
            body: Object.assign(Object.assign(Object.assign(Object.assign({}, formData), body), metapropertiesObject), additionalMetaPropertiesObject)
        };
        const branddata = brands.join(" ");
        if (debugLog == 'Yes')
            await job.log(LogLevel.Debug, 'Hema-New' + "brands: %1", [branddata]);
        try {
            if (brands && brands.length > 0) {
                const brand = brands === null || brands === void 0 ? void 0 : brands.find(brand => brand);
                const response = await (0, node_fetch_1.default)(`${URL}${brand.brandId}`, options);
                return await response.json();
            }
        }
        catch (error) {
            console.error('Error:', error);
        }
    };
}
//# sourceMappingURL=main.js.map