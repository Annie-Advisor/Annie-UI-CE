import './scss/UIElements.scss';
import {formatDate, shadeColor} from "./Formats";
import {ReactComponent as StatusIcon} from "./svg/status.svg";
import {ReactComponent as CloseIcon} from "./svg/close.svg";
import {useIntl} from "react-intl";
import {ReactComponent as ReplyIcon} from "./svg/reply.svg";
import {ReactComponent as ErrorIcon} from "./svg/error.svg";
import {ReactComponent as SuccessIcon} from "./svg/success.svg";
import {ReactComponent as FailIcon} from "./svg/fail.svg";
import React, {useEffect, useRef, useState} from "react";

export function Skeleton( {height, width, circle, inline, noMargin, classText} ) {
    let className = "skeleton"
    if (inline || width) {className = className.concat(' inline')}
    if (circle) {className = className.concat(' circle')}
    if (noMargin) {className = className.concat(' no-margin')}
    if (classText) {className = className.concat(' '+classText)}
    return <span
        className={className}
        style={{height: height, width: width}}
    />
}

export function StatusText({survey}) {
    const intl = useIntl()
    let startTime = new Date(formatDate(survey.starttime))
    let endTime = new Date(formatDate(survey.endtime))
    let currentTime = new Date()
    let status
    let statusClass
    if (startTime > currentTime) {
        status = intl.formatMessage(
            {
                id: 'main.surveys.status.scheduled',
                defaultMessage: 'Scheduled',
            }
        )
        statusClass = "scheduled"
    }
    if (startTime <= currentTime && endTime > currentTime) {
        status = intl.formatMessage(
            {
                id: 'main.surveys.status.inProgress',
                defaultMessage: 'In Progress',
            }
        )
        statusClass = "in-progress"
    }
    if (endTime <= currentTime) {
        status = intl.formatMessage(
            {
                id: 'main.surveys.status.finished',
                defaultMessage: 'Finished',
            }
        )
        statusClass = "finished"
    }
    if (survey.status === "DRAFT") {
        status = intl.formatMessage(
            {
                id: 'main.surveys.status.draft',
                defaultMessage: 'Draft',
            }
        )
        statusClass = "draft"
    }

    return <p className={"status " + statusClass}>
        <StatusIcon />
        {status}
    </p>
}

export function Popover({closePopover, children}) {
    const refPopover = useRef(null)
    useEffect(()=>{
        document.addEventListener("mousedown", handleClickOutside)
        function handleClickOutside(event) {
            if (refPopover.current && !refPopover.current.contains(event.target)) {
                closePopover()
            }
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    },[refPopover, closePopover])
    return <>
    <div ref={refPopover} className={"popover"}>
        {children}
    </div>
    </>
}

export function Popup({closePopup, children}) {
    const refPopup = useRef(null)
    useEffect(()=>{
        document.addEventListener("mousedown", handleClickOutside)
        function handleClickOutside(event) {
            if (refPopup.current && !refPopup.current.contains(event.target)) {
                closePopup()
            }
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    },[refPopup, closePopup])
    return <>
        <div className={"popup-overlay"}>
            <div ref={refPopup} className={"popup"}>
                <div className={"close-toggle-container"}>
                    <div className={"close-toggle"} onClick={closePopup}>
                        <CloseIcon />
                    </div>
                </div>
                {children}
            </div>
        </div>
    </>
}

export function Modal(props) {
    const intl = useIntl()
    return <div className={"modal-container"}>
        <div className={"close-modal"} onClick={props.closeModal}/>
        <div className={"modal"}>
            <div className={"close-toggle-container"}>
                <div className={"close-toggle"} onClick={props.closeModal}>
                    <CloseIcon />
                </div>
            </div>
            <h3>{props.header}</h3>
            {props.text &&
            <p>{props.text}</p>
            }
            {props.children}
            <div className={"modal-options"}>
                {props.discardText &&
                <button onClick={props.discardAction} className={"discard alert"}>
                    {props.discardText}
                </button>
                }
                <button className={"cancel"} onClick={props.closeModal}>
                    {intl.formatMessage(
                    {
                        id: 'modal.cancel',
                        defaultMessage: 'Cancel',
                    })}
                </button>
                <button onClick={props.confirmAction} className={props.alert ? "alert confirm" : "confirm"}>
                    {props.confirmText}
                </button>
            </div>
        </div>
    </div>
}

export function getMessageIcon(props, isBranch) {
    if (props.hasOwnProperty('keyValue')) {
        if ((isBranch && props.condition === ".*") || (props.hasOwnProperty('data') && props.data[props.keyValue].condition === ".*")) {
            return <ReplyIcon/>
        } else if (isBranch) {
            return props.keyValue.slice(6)
        } else if (props.keyValue === 'other') {
            return <ErrorIcon/>
        } else {
            return props.keyValue
        }
    }
    return '?'
}

export function getBranchIconColor(props, isBranch) {
    if (isBranch && props.parentColor) {
        return shadeColor(props.parentColor, -props.i*10)
    } else if (isBranch) {
        switch (props.keyValue.charAt(6)) {
            case "A":
                return "#8E99E4"
            case "B":
                return "#FF9650"
            case "C":
                return "#FFCE00"
            case "D":
                return "#FD779F"
            case "E":
                return "#007E71"
            case "F":
                return "#00469A"
            case "H":
                return "#8E99E4"
            case "I":
                return "#FF9650"
            case "J":
                return "#FFCE00"
            case "K":
                return "#FD779F"
            case "L":
                return "#007E71"
            case "M":
                return "#00469A"
            default:
                return "#8E99E4"
        }
        /*
       if (props.i % 6 === 0) { return "#8E99E4" }
        if (props.i % 6 === 1) { return "#FF9650" }
        if (props.i % 6 === 2) { return "#FFCE00" }
        if (props.i % 6 === 3) { return "#FD779F" }
        if (props.i % 6 === 4) { return "#007E71" }
        if (props.i % 6 === 5) { return "#00469A" }
        return "#8E99E4"
        */
    } else {
        return "#ADADAD"
    }
}

export function Toast({show, text, status, dismiss, hideToast}) {
    let className = "toast"
    let icon
    if (status === "success") {
        className = className.concat(' success')
        icon = <SuccessIcon/>
    }
    if (status === "alert") {
        className = className.concat(' alert')
        icon = <FailIcon/>
    }
    if (!dismiss) {
        setTimeout(()=> {
            disappear()
        }, 5000)
    }
    function disappear() {
        /*className = className.concat(' disappear')
        setTimeout(()=> {

        }, 300)*/
        hideToast()
    }
    return <>
        {show &&
        <div className={className}>
            <p>
                {icon &&
                <span className={"icon"}>{icon}</span>
                }
                <span>{text}</span>
            </p>
            {dismiss &&
            <div className={"close"} onClick={()=>disappear()}>
                <CloseIcon />
            </div>
            }
        </div>
        }
    </>
}