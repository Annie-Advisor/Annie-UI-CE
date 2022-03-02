import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from "react";
import './scss/Content.scss';
import {Routes, Route, Outlet, Link, useLocation } from "react-router-dom";
import {SupportNeedsView} from "./views/SupportNeedsView";
import {ReactComponent as Logo} from "./svg/logo-green.svg";
import {ReactComponent as CloseIcon} from "./svg/close.svg";

import SupportRequest from "./views/SupportRequest";
import {useAuthData, useCurrentUserData} from "./App";
import {LocaleSwitcher} from "./LocaleContext";
import {useIntl} from "react-intl";
import {CSSTransition, TransitionGroup} from "react-transition-group";
import Unsubscribe from "./views/Unsubscribe";

export default function Content() {
    const location = useLocation()
    const [transitionName, setTransitionName] = useState("next")
    const nodeRef = React.useRef()
    const {state} = location
    const navigated = state && state.navigated
    const headerRefresh = state && state.from === "header" && !navigated
    useEffect(() => {
        if (location.pathname === "/") {
            setTransitionName("prev")
            const scrollPosition = sessionStorage.getItem("scrollPosition")
            if (scrollPosition) {
                window.scrollTo(0, parseInt(scrollPosition))
                sessionStorage.removeItem("scrollPosition")
            }
        } else {
            setTransitionName("next")
            navigated && !headerRefresh && setTimeout(()=>{window.scrollTo(0, 0)},500)
        }
        headerRefresh && setTransitionName("none")
    }, [location, headerRefresh, navigated])

    return <TransitionGroup component={null}>
        <CSSTransition
            key={location.key}
            classNames={transitionName}
            timeout={!headerRefresh ? 500: 0}
            nodeRef={nodeRef}>
            <div ref={nodeRef}>
                <Routes location={location}>
                    <Route path="/" element={<Contexts />}>
                        <Route index element={<SupportNeedsView />} />
                        <Route path={'request/:requestId'} element={<SupportRequest />}/>
                        <Route path={'unsubscribe'} element={<Unsubscribe />} />
                        <Route path={'*'} element={<SupportNeedsView />} />
                    </Route>
                </Routes>
            </div>
        </CSSTransition>
    </TransitionGroup>
}

const ToastContext = createContext({
    toastContext: {},
    setToastContext: () => {}
})

function ToastProvider({children, toastContext}) {
    const [toastData, setToastData] = useState(toastContext)
    const value = useMemo( () => (
        {toastData, setToastData}
        ),[toastData])
    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToastData() {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToastData must be used within an CurrentToastProvider')
    }
    return context
}

function Contexts() {
    const toastData = {display: false, closeable: false, type:"generic", text:""}
    return <ToastProvider toastContext={toastData}>
        <Layout toastData={toastData}/>
    </ToastProvider>
}

function Layout() {
    return <div className={"content"}>
        <div className={"header"}>
            <Link className={"logo"} to="/" state={{from:"header"}}>
                <Logo />
            </Link>
            <Profile />
        </div>
        <div className={"main"}>
            <Outlet />
        </div>
        <Toast />
    </div>
}

function Toast() {
    const {toastData, setToastData} = useToastData()
    const closeable = toastData.closeable
    const toastType = toastData.type  // generic, error, warning, success, info, hint
    const displayToast = toastData.display
    const toastText = toastData.text

    const hideToast = () => {
        setToastData({display: false, closeable: false, type:"generic", text:""})
    }

    if (displayToast) {
        return <div className={"toast " + toastType}>
            <p>{toastText}</p>
            {closeable &&
                <button onClick={()=>hideToast()} className={"close"}><CloseIcon/></button>
            }
        </div>
    }
    return null
}

export function Profile() {
    const {currentUserData} = useCurrentUserData()
    const {authData} = useAuthData()
    const firstName = currentUserData && currentUserData.meta.hasOwnProperty("firstname") ? currentUserData.meta.firstname : null
    const lastName = currentUserData && currentUserData.meta.hasOwnProperty("lastname") ? currentUserData.meta.lastname : null
    const email = currentUserData && currentUserData.hasOwnProperty("id") ? currentUserData.id : authData.uid
    const initials = (firstName && lastName) ? firstName.charAt(0) + lastName.charAt(0) : email.substring(0, 2)
    const [showProfilePopover, setShowProfilePopover] = useState(false)
    const popoverRef = useRef(null)
    const popoverTriggerRef = useRef(null)
    const intl = useIntl()
    const logoutURL = authData.hasOwnProperty("logoutURL") ? authData.logoutURL : null

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside)
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target) && !popoverTriggerRef.current.contains(event.target) ) {
                setShowProfilePopover(false)
            }
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    },[popoverRef])

    return <div className={"profile-container"}>
        <button className={"profile-icon"} ref={popoverTriggerRef} onClick={()=>setShowProfilePopover(!showProfilePopover)}>{initials}</button>
        {showProfilePopover &&
        <div className={"profile-popover"} ref={popoverRef}>
            {firstName && lastName &&
                <>
                    <h2>{firstName} {lastName}</h2>
                    <hr/>
                </>
            }
            <h4>
                {intl.formatMessage({
                    id: 'profile',
                    defaultMessage: 'Profile',
                })}
            </h4>
            <p>{email}</p>
            <hr/>
            <h4>
                {intl.formatMessage({
                    id: 'language',
                    defaultMessage: 'Language',
                })}
            </h4>
            <LocaleSwitcher />
            {logoutURL &&
                <>
                    <hr/>
                    <a href={logoutURL}>
                        {intl.formatMessage({
                            id: 'logOut',
                            defaultMessage: 'Log out',
                        })}
                    </a>
                </>
            }

        </div>
        }
    </div>
}