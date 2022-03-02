import React, {useContext, useMemo, useState} from "react"
import './scss/App.scss'
import {
    QueryClient,
    QueryClientProvider,
} from "react-query"
import {
    BrowserRouter as Router,
} from "react-router-dom"
import Content from "./Content"
import LocaleWrapper from "./LocaleContext"
import {AuthCheck, GetUser} from "./api/APISurvey";
import {ReactComponent as CloudLogo} from "./svg/logo-green.svg";

export const queryClient = new QueryClient()

const AuthContext = React.createContext({
    authContext: {},
    setAuthContext: () => {}
})

function AuthProvider({children, authContext}) {
    const [authData, setAuthData] = useState(authContext)
    const value = useMemo(() =>(
        {authData, setAuthData}
    ), [authData])
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthData() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuthData must be used within an AuthProvider')
    }
    return context
}

const CurrentUserContext = React.createContext({
    currentUserContext: {},
    setCurrentUserContext: () => {}
})

function CurrentUserProvider({children, userContext}) {
    const [currentUserData, setCurrentUserData] = useState(userContext)
    const value = useMemo(() =>(
        {currentUserData, setCurrentUserData}
    ), [currentUserData])
    return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
}

export function useCurrentUserData() {
    const context = useContext(CurrentUserContext)
    if (context === undefined) {
        throw new Error('useCurrentUserData must be used within an CurrentUserProvider')
    }
    return context
}

function App() {
    return <QueryClientProvider client={queryClient}>
        <Auth />
    </QueryClientProvider>
}

function Auth() {
    let auth
    let loading = true
    const authContext = window.location.hostname === "localhost" ?
        {
            status:"success",
            data:{
                "logouturl":"https://dev.annieadvisor.com/simplesaml/module.php/core/as_logout.php?AuthId=sp-google&ReturnTo=https%3A%2F%2Fdev.annieadvisor.com%2Fapi%2Fauth.php",
                "firstname":"localhost",
                "lastname":"developer",
                "uid":"topi.sarkiniemi@annieadvisor.com"}
        }
        : AuthCheck()
    if (authContext.status === "loading") {
        auth = false
        loading = true
    }
    if (authContext.status === "success") {
        auth = true
        loading = false
    }
    if (authContext.status === "error" && typeof authContext.error.response.data.loginURL !== undefined) {
        loading = false
        window.location.href = authContext.error.response.data.loginURL
    }
    return loading ? <Loading /> : auth ? <AuthSuccess authContext={authContext.data}/> : <AuthError />
}

function AuthSuccess({authContext}) {
    const getUser = GetUser(authContext.uid)
    return getUser.status === "loading" ? <Loading /> :
        <AuthProvider authContext={authContext}>
            <CurrentUserProvider userContext={getUser.data[0]}>
                <LocaleWrapper>
                    <Router basename={"/admin"}>
                        <div className={"app"}>
                            <Content />
                        </div>
                    </Router>
                </LocaleWrapper>
            </CurrentUserProvider>
    </AuthProvider>
}

function AuthError() {
    return <div className={"app"}>
        <div className={"content center login"}>
            <div>
                <div className={"logo"}>
                    <CloudLogo />
                </div>
                <h1>Sorry. Seems like an authentication error.</h1>
                <p>Please contact <a href={"mailto:annie@annieadvisor.com"}>annie@annieadvisor.com</a></p>
            </div>
        </div>
    </div>
}

function Loading() {
    return <div className={"app"}>
        <div className={"content center login"}>
            <div>
                <h1>Loading...</h1>
            </div>
        </div>
    </div>
}

export default App;