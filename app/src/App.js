import React, {useContext, useMemo, useState} from "react"
import './scss/App.scss'
import {
  QueryClient,
  QueryClientProvider,
} from "react-query"
import Content, {Profile} from "./Content"
import LocaleWrapper from "./LocaleContext"
import {AuthCheck, GetUser} from "./API";
import {ReactComponent as Logo, ReactComponent as CloudLogo} from "./svg/logo-green.svg";
import {FormattedMessage, useIntl} from "react-intl";
import {ReactComponent as Face} from "./svg/face.svg";

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
    <LocaleWrapper>
      <Auth />
    </LocaleWrapper>
  </QueryClientProvider>
}

function Auth() {
  const authContext = window.location.hostname === "localhost" ?
      {
        status:"success",
        data:{
          "logoutURL":"https://dev.annieadvisor.com/simplesaml/module.php/core/as_logout.php?AuthId=sp-google&ReturnTo=https%3A%2F%2Fdev.annieadvisor.com%2Fapi%2Fauth.php",
          "firstname":"localhost",
          "lastname":"developer",
          "uid":"topi.sarkiniemi@annieadvisor.com",
          "status":"OK"
        }
      }
      : AuthCheck()

  const success = authContext.status === "success" && authContext.data.hasOwnProperty("uid") && authContext.data.hasOwnProperty("status") && authContext.data.status === "OK"
  const error = authContext.status === "error"

  if (success) {
    return <AuthSuccess authContext={authContext.data}/>
  }
  if (error) {
    if (typeof authContext.error.response.data.loginURL !== undefined) {
      window.location.href = authContext.error.response.data.loginURL
    } else {
      return <AuthError />
    }
  }
  // return loading ? <Loading /> : auth ? <AuthSuccess authContext={authContext.data}/> : <AuthError />
  return <Loading />
}

function AuthSuccess({authContext}) {
  const getUser = GetUser(authContext.uid)
  return getUser.status === "loading" ? <Loading /> :
      getUser.data.length > 0 ?
      <AuthProvider authContext={authContext}>
        <CurrentUserProvider userContext={getUser.data[0]}>
            <div className={"app"}>
              <Content />
            </div>
        </CurrentUserProvider>
      </AuthProvider> :
          <AuthProvider authContext={authContext}>
            <MissingAnnieUser />
          </AuthProvider>
}

function MissingAnnieUser() {
  const hostname = window.location.hostname
  const instanceEmail = hostname.indexOf(".") > -1 ? hostname.substring( 0, hostname.indexOf(".") ) +"@annieadvisor.com" : hostname +"@annieadvisor.com"
  return <div className={"app"}>
    <div className={"content"}>
      <div className={"header"}>
        <span className={"logo"}>
          <Logo />
        </span>
        <Profile />
      </div>
      <div className={"main"}>
        <main className={"support-requests-wrapper"}>
        <div className={"support-requests-container"}>
          <div className={"no-requests-container"}>
            <div id={"no-requests"}>
              <Face />
            </div>
            <h4>
              <FormattedMessage
                  id={"noAnnieUser"}
                  defaultMessage={"Successfully logged in!{br}{br}You have not yet been granted access privileges to Annie. If you think this is a mistake, please contact"}
                  values={{br: <br/>}}/> <a href={"mailto:"+instanceEmail}>{instanceEmail}</a>
            </h4>
          </div>
        </div>
        </main>
      </div>
    </div>
  </div>
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
        <div className={"loader"}>
          <Logo />
          <div className={"loader-container"}>
            <div className={"loader-bar"}/>
          </div>
        </div>
    </div>
  </div>
}

export default App;
