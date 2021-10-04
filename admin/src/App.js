import React, {useMemo, useState} from "react"
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
import {AuthCheck} from "./api/APISurvey";
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
    return <AuthProvider authContext={authContext}>
        <LocaleWrapper>
            <Router basename={"/admin"}>
                <div className={"app"}>
                    <Content />
                </div>
            </Router>
        </LocaleWrapper>
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