import {useState} from "react";
import "./scss/Sidebar.scss"
import {useIntl} from "react-intl";
import {NavLink} from "react-router-dom";
import {LocaleSwitcher} from "./LocaleContext";
import { ReactComponent as SurveysIcon } from "./svg/surveys.svg"
import { ReactComponent as ContactsIcon } from "./svg/contacts.svg"
import { ReactComponent as UsersIcon } from "./svg/users.svg"
import { ReactComponent as ToggleSidebar } from "./svg/toggle.svg"
import {ReactComponent as Logo} from "./svg/logo.svg";

export default function Sidebar() {
    const [isSidebarOpen, toggleSidebarOpen] = useState(true)
    const intl = useIntl()
    if (!isSidebarOpen) {
        return <div className={"sidebar closed"}>
            <h1>
                <div className={"toggle-sidebar"} onClick={() => toggleSidebarOpen(!isSidebarOpen)}>
                    <ToggleSidebar />
                </div>
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
            <div className={"toggle-sidebar"} onClick={() => toggleSidebarOpen(!isSidebarOpen)}>
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