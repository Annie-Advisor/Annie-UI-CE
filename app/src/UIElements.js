import './scss/UIElements.scss';
import {useIntl} from "react-intl";

export function Header({children}) {
    return <header>
        <h1>
            {children}
        </h1>
    </header>
}

export function Skeleton({height, width, circle, inline, marginBottom, classText} ) {
    let className = "skeleton"
    if (circle) {className = className.concat(' circle')}
    if (classText) {className = className.concat(' '+classText)}
    let display = inline ? "inline-block" : "block"
    return <div
        className={className}
        style={{height: height, width: width, display: display, marginBottom: marginBottom}}
    />
}

export function RequestStatus({status}){
    const intl = useIntl()
    let statuses
    if (status === "100") {
        statuses = <div className={"status seen"}>
            {intl.formatMessage({
                id: 'seen',
                defaultMessage: 'Seen',
            })}
        </div>
    }
    if (status === "2") {
        statuses = <div className={"status open"}>
            {intl.formatMessage({
                id: 'open',
                defaultMessage: 'open',
            })}
        </div>
    }
    if (status === "1") {
        statuses = <>
            <div className={"status open"}>
                {intl.formatMessage({
                id: 'open',
                defaultMessage: 'open',
            })}
            </div>
            <div className={"status new"}>
                {intl.formatMessage({
                    id: 'new',
                    defaultMessage: 'New',
                })}
            </div>
            </>
    }
    if (status === "-1") {
        statuses = <div className={"status error"}>
            {intl.formatMessage({
                id: 'error',
                defaultMessage: 'Error',
            })}
        </div>
    }
    return <div className={"status-container"}>
        {statuses}
    </div>
}