import React, {useEffect, useState} from "react";
import './scss/Content.scss';
import {Route, Switch, Redirect} from "react-router-dom"
import Surveys from "./views/Surveys"
import Contacts from "./views/Contacts"
import Users from "./views/Users"
import Sidebar from "./Sidebar"
import SurveyView from "./views/SurveyView"
import useWindowDimensions from "./DataFunctions";

export default function Content() {
    const [windowSizeClass, setWindowSizeClass] = useState("")
    let contentClass = "content-container " + windowSizeClass
    const {width} = useWindowDimensions()
    useEffect(()=>{
        if (windowSizeClass !== "tablet" && width < 769) {
            setWindowSizeClass("tablet")
        }
        if (windowSizeClass === "tablet" && width > 768) {
            setWindowSizeClass("")
        }
    },[width])

    return <div className={contentClass}>
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