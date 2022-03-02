import {useMutation, useQuery} from "react-query"
import axios from "axios"
const auth = window.location.hostname === "localhost" ? {auth: {username: '', password: ''}} : null

export function AuthCheck() {
    return useQuery("auth", async () => {
        const { data } = await axios.post(
            "/api/auth.php",
            {
                "ReturnTo":window.location.href
            }
        )
        return data
    }, {
        retry: false
    })
}

export function GetSurveys(status) {
    return useQuery("surveys", async () => {
        if (status) {
            const { data } = await axios.get(
                "/api/survey.php?status="+status,
                auth
            )
            return data
        } else {
            const { data } = await axios.get(
                "/api/survey.php",
                auth
            )
            return data
        }
    })
}

export function GetSurveyWithId(surveyId) {
    // TODO: Check caching. Currently not updated when editing
    return useQuery(['surveys', { id:  surveyId }], async () => {
        const { data } = await axios.get(
            "/api/survey.php/"+surveyId,
            auth
        )
        return data
    }, {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount:"always",
        cacheTime:0,
    })
}

export function UpdateSurveyWithId(surveyId) {
    return useMutation(['surveys', { id:  surveyId }],surveyData => {
        const data = axios.put(
            "/api/survey.php/" + surveyId,
            surveyData,
            auth
        )
        return data
    })
}

export function PostSurveyWithId(surveyId) {
    return useMutation(['surveys', { id:  surveyId }],surveyData => {
        const data = axios.post(
            "/api/survey.php/" + surveyId,
            surveyData,
            auth
        )
        return data
    })
}

export function GetSupportNeeds() {
    return useQuery("supportneeds", async () => {
            const { data } = await axios.get(
            window.location.hostname === "localhost" ? window.location.origin+"/admin/mock-api/supportneed.json" : "/api/supportneed.php/"
        )
        return data
    })
}

export function GetUsers() {
    return useQuery("annieuser", async () => {
        const { data } = await axios.get(
            "/api/annieuser.php/",
            auth
        )
        return data
    })
}

export function GetUser(user) {
    return useQuery("user", async () => {
        const { data } = await axios.get(
            "/api/annieuser.php/"+user,
            auth
        )
        return data
    })
}

export function GetUserSurvey() {
    return useQuery("annieusersurvey", async () => {
        const { data } = await axios.get(
            "/api/annieusersurvey.php/",
            auth
        )
        return data}, {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount:true
    })
}

export function GetUserBySurvey(surveyId) {
    return useQuery(['annieusersurvey', { id:  surveyId }], async () => {
        const { data } = await axios.get(
            "/api/annieusersurvey.php/?survey=" + surveyId,
            auth
        )
        return data}, {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount:"always",
        cacheTime:0,
    })
}

export function PostUsersToAnnieUserSurvey() {
    return useMutation('annieusersurvey', userSurveyData => {
        const data = axios.post(
            "/api/annieusersurvey.php/",
            userSurveyData,
            auth
        )
        return data
    })
}

// Does not exist?
export function GetSupportNeedUsersBySurvey(surveyId) {
    return useQuery("annieusersurvey", async () => {
        const { data } = await axios.get(
            "/api/annieusersurvey.php/",
            auth
        )
        return data
    })
}

export function GetSupportContacts() {
    return useQuery("contacts", async () => {
        const { data } = await axios.get(
            "/api/contact.php/",
            auth
        )
        return data
    })
}

export function GetSupportContactsWithId(surveyId) {
    return useQuery(['contacts', { id:  surveyId }], async () => {
        const { data } = await axios.get(
            "/api/contact.php/"+surveyId,
            auth
        )
        return data
    }, {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount:"always",
        cacheTime:0,
    })
}

export function GetCodes() {
    return useQuery("codes", async () => {
        const { data } = await axios.get(
            "/api/codes.php/",
            auth
        )
        return data
    })
}

export function PostCodes() {
    return useMutation('codes', codesData => {
        const data = axios.post(
            "/api/codes.php/",
            codesData,
            auth
        )
        return data
    })
}

export function GetContacts() {
    return useQuery("contacts", async () => {
        const { data } = await axios.get(
            "/api/contact.php",
            auth
        )
        return data
    })
}

export async function archiveSurveyWithId(surveyId) {
    try {
        const response = await axios.get(
            "/api/archive-survey-statistics.php?survey="+surveyId+"&archive=true",
            auth
        )
        return response
    } catch (error) {
        console.error(error)
        return error
    }

}