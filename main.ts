import fetch from 'node-fetch'
import * as fs from 'fs'
import FormData from 'form-data'


async function jobArrived(s: Switch, flowElement: FlowElement, job: Job) {
    const debugLog = await flowElement.getPropertyStringValue('debug')

    const getAuthToken = async () => {
        const url = 'https://auth-int.hema.digital/token'
        
        const body = new URLSearchParams({
            client_id: 'preprod-package-specs',
            client_secret: 'hcs_Q8j1kUjpPZlmX686mO0ZG8p1veUAcfprznOF',
            grant_type: 'client_credentials',
        })
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        }
        
        try {
            const response = await fetch(url, options)
            
            return await response.json()
        } catch (error) {
            // console.error('Error:', error)
            job.fail('Error:', error as any)
        }
    }
    
    
    const getBrands = async () => {
        const url = 'https://acc.business-preprod.hema.digital/dam-engine/api/v4/media'
        
        const tokenData = await getAuthToken() as {access_token: string}
        
        const token = tokenData?.access_token as string
        
        const debugLog = await flowElement.getPropertyStringValue('debug')
        
        
        if (debugLog == 'Yes') await job.log(LogLevel.Debug, 'Hema-New' + "token: %1", [token])
            
        
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        }
        
        try {
            const response = await fetch(url, options)
            
            return  await response.json()
        } catch (error) {
            // console.error('Error:', error)
            job.fail('Error:', error as any)
        }
    }

    const uploadFile = async () => {
        
        const baseURL = 'https://acc.business-preprod.hema.digital/dam-engine/api/v4/media'
        
        const jobName = job.getName(true) as string
        
        const jobPath = await job.get(AccessLevel.ReadOnly)
        //const metaPropertiesObject = {"metaproperty.30379270-3D30-41F0-A0F97BEBB33903D7": "13D566BE-1739-4531-A3866EB6C72D28D0","metaproperty.67451A63-2D23-4D8F-B19E278371DDDA39": "9477A674-AA5C-4D2E-AD9FD8DC2FB548AD","metaproperty.33DFD186-D235-4D86-99C9696AEABEE104": "81FBC06F-B092-4777-961E544FC2841D75"}
        const metaproperties = await flowElement.getPropertyStringValue('metaproperties') as string
        const metapropertiesObject = JSON.parse(metaproperties)
        
        const additionalMetaPropertiesObject = {
            "property_ProductAsset": ["Yes"],
            "property_ContentCategory": ["ProductAttachment"],
            "property_ProductAttachment": ["Packaging"],
            "isPublic": 1,
        }
        
        const formData = new FormData()
        const fileContents = fs.readFileSync(jobPath)
        formData.append('fileContents', fileContents, { filename: jobName })
        
        const debugLog = await flowElement.getPropertyStringValue('debug')

        // if (debugLog == 'Yes') await job.log(LogLevel.Debug, 'Hema-New' + "formData: %1", [formData.toString()])
        
        
        const brands = await getBrands()

        const body = new URLSearchParams({
            client_id: 'preprod-package-specs',
            client_secret: 'hcs_Q8j1kUjpPZlmX686mO0ZG8p1veUAcfprznOF',
            grant_type: 'client_credentials',
        })
        
        const options = {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded',},
            body: {
                ...formData,
                ...body,
                ...metapropertiesObject,
                ...additionalMetaPropertiesObject
            }
        }
        
        
        const branddata = brands.join(" ") as string
        
        if (debugLog == 'Yes') await job.log(LogLevel.Debug, 'Hema-New' + "brands: %1",[branddata])
            
        
        try {
            if (brands && brands.length > 0) {
                const brand = brands?.find((brand: {brandId: string}) => brand) as {brandId: string}
                
                const response = await fetch(`${baseURL}${brand.brandId}`, options)
                
                return await response.json()
            }
        } catch (error) {
            // console.error('Error:', error)
            job.fail('Error:', error as any)
        }   
        
    }

    const uploadResponse = await uploadFile()
    if (debugLog == 'Yes') await job.log(LogLevel.Debug, 'Hema-New' + "uploadResponse: %1", [JSON.stringify(uploadResponse)])
    
    
}
