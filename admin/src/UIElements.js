import './scss/UIElements.scss';
import {formatDate, shadeColor} from "./Formats";
import {ReactComponent as StatusIcon} from "./svg/status.svg";
import {ReactComponent as CloseIcon} from "./svg/close.svg";
import {useIntl} from "react-intl";
import {ReactComponent as ReplyIcon} from "./svg/reply.svg";
import {ReactComponent as ErrorIcon} from "./svg/error.svg";
import React, {useEffect, useRef} from "react";

export function Skeleton( {height, width, circle, inline} ) {
    let className = "skeleton"
    if (inline || width) {className = className.concat(' inline')}
    if (circle) {className = className.concat(' circle')}
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

export function Popover(props) {
    const refPopover = useRef(null)
    useEffect(()=>{
        document.addEventListener("mousedown", handleClickOutside)
        function handleClickOutside(event) {
            if (refPopover.current && !refPopover.current.contains(event.target)) {
                props.closePopover()
            }
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    },[refPopover])
    return <>
    <div ref={refPopover} className={"popover"}>
        {props.children}
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
            <p>{props.text}</p>
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
    if (isBranch && props.data[props.keyValue].condition === ".*") {
        return <ReplyIcon />
    } else if (isBranch) {
        return props.keyValue.slice(6)
    } else if (props.keyValue === 'other') {
        return <ErrorIcon />
    } else {
        return props.keyValue
    }
}

export function getBranchIconColor(props, isBranch) {
    if (isBranch && props.parentColor) {
        return shadeColor(props.parentColor, -props.i*10)
    } else if (isBranch) {
       if (props.i % 5 === 0) { return "#1AB0F5" }
        if (props.i % 5 === 1) { return "#FFA245" }
        if (props.i % 5 === 2) { return "#1ECC92" }
        if (props.i % 5 === 3) { return "#F75A52" }
        if (props.i % 5 === 4) { return "#A20D50" }
        return "#1AB0F5"
    } else {
        return "#BFBFBF"
    }
}