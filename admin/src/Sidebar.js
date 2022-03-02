import {useEffect, useState} from "react";
import "./scss/Sidebar.scss"
import {useIntl} from "react-intl";
import {NavLink} from "react-router-dom";
import {LocaleSwitcher} from "./LocaleContext";
import { ReactComponent as SurveysIcon } from "./svg/surveys.svg"
import { ReactComponent as ContactsIcon } from "./svg/contacts.svg"
import { ReactComponent as UsersIcon } from "./svg/users.svg"
import { ReactComponent as ToggleSidebar } from "./svg/toggle.svg"
import {ReactComponent as Logo} from "./svg/logo.svg";
import useWindowDimensions from "./DataFunctions";

export default function Sidebar() {
    const [sidebarOpen, setSidebarOpen] = useState( localStorage.getItem("sidebarOpen") ? JSON.parse(localStorage.getItem("sidebarOpen")) : true)
    const {width} = useWindowDimensions()
    const [windowTabletOrSmaller, setWindowTabletOrSmaller] = useState(false)
    useEffect(()=>{
        if (!windowTabletOrSmaller && width < 769) {
            setSidebarOpen(false)
            setWindowTabletOrSmaller(true)
        }
        if (windowTabletOrSmaller && width > 768) {
            setSidebarOpen(true)
            setWindowTabletOrSmaller(false)
        }
    },[width])
    const intl = useIntl()
    if (!sidebarOpen) {
        return <div className={"sidebar closed"}>
            <h1>
            {!windowTabletOrSmaller ?
            <div className={"toggle-sidebar"} onClick={() => {
                localStorage.setItem("sidebarOpen", JSON.stringify(!sidebarOpen))
                setSidebarOpen(!sidebarOpen)
            }}>
                <ToggleSidebar />
            </div> :
                <div className={"logo"}>

                </div>
            }
            </h1>
            <nav>
                <ul>
                    <li>
                        <NavLink to={"/surveys"}>
                            <SurveysIcon />
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to={"/contacts"}>
                            <ContactsIcon />
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to={"/support-providers"}>
                            <UsersIcon />
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </div>
    }
    return <div className={"sidebar"}>
        <h1>
            <div className={"logo"}>
                <Logo />
            </div>
            <div className={"toggle-sidebar"} onClick={() => {
                localStorage.setItem("sidebarOpen", JSON.stringify(!sidebarOpen))
                setSidebarOpen(!sidebarOpen)
            }}>
                <ToggleSidebar />
            </div>
        </h1>
        <nav>
            <ul>
                <li>
                    <NavLink to={"/surveys"}>
                        <SurveysIcon />
                        {intl.formatMessage(
                        {
                            id: 'main.sidebar.surveys',
                            defaultMessage: 'Surveys',
                        })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to={"/contacts"}>
                        <ContactsIcon />
                        {intl.formatMessage(
                        {
                         id: 'main.sidebar.contacts',
                            defaultMessage: 'Contacts',
                        })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to={"/support-providers"}>
                        <UsersIcon />
                        {intl.formatMessage(
                        {
                            id: 'main.sidebar.supportProviders',
                            defaultMessage: 'Support Providers',
                        })}
                    </NavLink>
                </li>
            </ul>
        </nav>
        <LocaleSwitcher />
    </div>
}