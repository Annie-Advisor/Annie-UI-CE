import React from "react";
import './scss/Content.scss';
import {Route, Switch, Redirect} from "react-router-dom"
import Surveys from "./views/Surveys"
import Contacts from "./views/Contacts"
import Users from "./views/Users"
import Sidebar from "./Sidebar"
import SurveyView from "./views/SurveyView"

export default function Content() {
    return <div className={"content-container"}>
        <Switch>
            <Route exact path={"/"}>
                <Sidebar />
                <Surveys />
            </Route>
            <Route path={"/surveys"}>
                <Sidebar />
                <Surveys />
            </Route>
            <Route path={"/contacts"}>
                <Sidebar />
                <Contacts />
            </Route>
            <Route path={"/users"}>
                <Sidebar />
                <Users />
            </Route>
            <Route path={'/survey/:surveyId'}>
                <Sidebar />
                <SurveyView />
            </Route>
            <Route path={"/survey"}>
                <Redirect to={"/surveys"} />
            </Route>
        </Switch>
    </div>
}