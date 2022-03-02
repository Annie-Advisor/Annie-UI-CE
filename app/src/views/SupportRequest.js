import React, {useEffect, useRef, useState} from "react";
import {Link, useParams} from "react-router-dom";
import '../scss/SupportRequest.scss';
import {
    GetCodes,
    GetColumnConfig,
    GetCommentOptions,
    GetContacts,
    GetRequestComments,
    GetRequestMessages,
    GetSupportNeed,
    PostSendEmail,
    PostSendSMS,
    PostSupportNeedComment,
    PostSupportNeedUpdate
} from "../API";
import {ReactComponent as BackArrow} from "../svg/back-arrow.svg";
import {ReactComponent as SeenIcon} from "../svg/seen.svg";
import {ReactComponent as ErrorIcon} from "../svg/error.svg";
import {ReactComponent as CommentIcon} from "../svg/comment.svg";
import {ReactComponent as PenIcon} from "../svg/pen.svg";
import {ReactComponent as HighFive} from "../svg/high-five.svg"
import {ReactComponent as MailIcon} from "../svg/mail.svg"
import {ReactComponent as ErrorBoy} from "../svg/error-boy.svg"
import {ReactComponent as MoreIcon} from "../svg/more.svg"
import {ReactComponent as CloseIcon} from "../svg/close.svg"
import {formatDate, getStudentFromContacts, useMediaQuery} from "../formats";
import {RequestStatus, Skeleton} from "../UIElements";
import {RequestUpdated} from "./SupportNeedsView";
import {FormattedMessage, useIntl} from "react-intl";
import {useCurrentUserData} from "../App";

export default function SupportRequest() {
    const { requestId } = useParams()
    const { status, data, reFetchSupportNeed, reFetchRequestComments } = GetRequestWithId(requestId)
    const loading = status === "loading"
    const error = status === "error"
    const success = status === "success"
    const noSuccess = status === "404"
    const intl = useIntl()
    const isMobile = useMediaQuery('(max-width: 678px)')

    return <div className={"support-request-container"}>
        <nav>
            <Link to={"/"} state={{navigated:true}}>
                <BackArrow />
                {isMobile ?
                    intl.formatMessage({
                        id: 'all',
                        defaultMessage: 'All',
                    }) :
                    intl.formatMessage({
                        id: 'allSupportRequests',
                        defaultMessage: 'All support requests',
                    })
                }
            </Link>
        </nav>
        <div className={"support-request-wrapper"}>
            {loading &&
                <SupportRequestSkeleton />
            }
            {success &&
                <SupportRequestContent
                    request={data.request}
                    codes={data.codes}
                    columnConfig={data.columns}
                    commentOptions={data.comments}
                    requestComments={data.requestComments}
                    requestHistory={data.requestHistory}
                    reFetchRequestComments={() => reFetchRequestComments()}
                    reFetchRequest={() => reFetchSupportNeed()}
                />
            }
            {error &&
                <FailedToLoad />
            }
            {noSuccess &&
                <NoRequestWithId />
            }
        </div>
    </div>
}

function SupportRequestContent({request, codes, columnConfig, commentOptions, requestComments, requestHistory, reFetchRequestComments, reFetchRequest}) {
    const intl = useIntl()
    const category = request.categoryName ? request.categoryName : intl.formatMessage({
        id: 'missingNameForCategory',
        defaultMessage: 'Name missing for support category',
    })
    useEffect(() => {
        document.title = request.studentName + " | Annie Advisor"
    }, [request])

    return <>
        <div className={"support-request"}>
            <div className={"support-request-header"}>
                <div>
                    <RequestStatus status={request.status}/>
                    <h1>{request.studentName}</h1>
                    <h2>{category}</h2>
                </div>
                <RequestUpdated request={request} />
            </div>
            <StudentInfo student={request.student} columnConfig={columnConfig} />
            <RequestHistory request={request} codes={codes} requestComments={requestComments} requestHistory={requestHistory}/>
            <RequestActions request={request} comments={commentOptions} reFetchRequestComments={reFetchRequestComments} reFetchRequest={reFetchRequest}/>
        </div>
    </>
}

// Currently unused way to get support providers for certain category
/*function CategoryProviders({request}) {
    const usersBySurvey = GetUserBySurvey(request.survey)
    const users = GetUsers()
    if (usersBySurvey.status === "loading" || usersBySurvey.status === "error" || users.status === "loading" || users.status === "error") {
        return null
    }
    return <CurrentSurveyProviders request={request} data={usersBySurvey.data} users={users.data}/>
}

function CurrentSurveyProviders({request, data, users}) {
   const topicSupportProviders = data.filter(user => user.hasOwnProperty("meta") && user.meta.hasOwnProperty("category") && user.meta.category[request.category])
    if (topicSupportProviders.length < 1) {
        return null
    }
    return <p className={"providers"}> – {topicSupportProviders.map((provider, i) => {
        if (i < 1) {
            return <React.Fragment key={i}>{getUserName(provider.annieuser, users)}</React.Fragment>
        }
        if (i === topicSupportProviders.length - 1) {
            return <React.Fragment key={i}> & {getUserName(provider.annieuser, users)}</React.Fragment>
        }
        return <React.Fragment key={i}>, {getUserName(provider.annieuser, users)}</React.Fragment>
    })}
   </p>
}

function getUserName(providerId, users) {
    const user = users.filter(user => user.id === providerId)[0]
    const userName = user.hasOwnProperty("meta") && user.meta.hasOwnProperty("firstname") && user.meta.hasOwnProperty("lastname") && user.meta.firstname && user.meta.lastname ? user.meta.firstname + " " + user.meta.lastname : providerId
    return userName
}
 */

function RequestActions({request, comments, reFetchRequestComments, reFetchRequest}) {
    const requestStatusOpen = request.status === "1" || request.status === "2"
    const requestStatusSeen = request.status === "100"
    const requestStatusError = request.status === "-1"
    const [showErrorDialog, setShowErrorDialog] = useState(false)
    const [showSetStatusSeen, setShowSetStatusSeen] = useState(requestStatusOpen && !showErrorDialog)
    const [showAddComments, setShowAddComments] = useState(requestStatusSeen || requestStatusError)
    const [selectedComments, setSelectedComments] = useState([])
    const [showCustomComment, setShowCustomComment] = useState(false)
    const [customCommentContent, setCustomCommentContent] = useState("")
    const [showCommentCompliment, setShowCommentCompliment] = useState(false)
    const [errorMessageContent, setErrorMessageContent] = useState("")
    const [showErrorCompliment, setShowErrorCompliment] = useState(false)
    const [navigateBackTo, setNavigateBackTo] = useState("setAsSeen")
    const intl = useIntl()

    const postSupportNeed = PostSupportNeedUpdate()
    const postSupportNeedComment = PostSupportNeedComment()
    const postSendSMS = PostSendSMS()
    const postSendEmail = PostSendEmail()

    const {currentUserData} = useCurrentUserData()
    const userRole = currentUserData.meta.hasOwnProperty("role") ? currentUserData.meta.role+" " : ""
    const userFirstName = currentUserData.meta.hasOwnProperty("firstname") ? currentUserData.meta.firstname+" " : ""
    const userLastName = currentUserData.meta.hasOwnProperty("lastname") ? currentUserData.meta.lastname+" " : ""
    const userPhoneNumber = currentUserData.meta.hasOwnProperty("phonenumber") ? "("+currentUserData.meta.phonenumber+") " : ""
    const userEmail = currentUserData.hasOwnProperty("id") ? "("+currentUserData.id+") " : ""
    const smsText = "Hei! " + userRole + userFirstName + userLastName + userPhoneNumber + "on nähnyt viestisi ja on sinuun mahdollisimman pian yhteydessä."
    const updatedBy = userFirstName + userLastName + userEmail

    useEffect(()=> {
        if (!showErrorDialog && !showCommentCompliment && !showErrorCompliment) {
            if (requestStatusOpen) {
                setShowSetStatusSeen(true)
                setShowAddComments(false)
            }
            if (requestStatusSeen || requestStatusError) {
                setShowAddComments(true)
                setShowSetStatusSeen(false)
            }
        }
    },[request])

    const setStatusOpen = () => {
        const supportNeedUpdate = {
            "contact": request.contact,
            "survey": request.survey,
            "category": request.category,
            "status": "2",
            "updatedby": updatedBy
        }
        postSupportNeed.mutate(supportNeedUpdate, {
            onError: error => {
                console.log(error)
            },
            onSuccess:() => {
                reFetchRequest()
            }
        })
    }

    useEffect(() => {
        if (!currentUserData.superuser && request.status === "1") {
            setStatusOpen()
        }
    },[request])

    const setStatusSeen = () => {
        const supportNeedUpdate = {
            "contact": request.contact,
            "survey": request.survey,
            "category": request.category,
            "status": "100",
            "updatedby": updatedBy
        }
        postSupportNeed.mutate(supportNeedUpdate, {
            onError: error => {
                console.log(error)
            },
            onSuccess:() => {
                console.log("Success!")
                reFetchRequest()
                setShowSetStatusSeen(false)
                setShowAddComments(true)
                if (request.hasOwnProperty("student") && request.student.hasOwnProperty("contact") && request.student.contact.phonenumber) {
                    sendStudentSms()
                }
            }
        })
    }

    const sendStudentSms = () => {
        const smsData = {
            "to": request.student.contact.phonenumber,
            "contact": request.contact,
            "body": smsText,
            "sender": "Annie",
            "survey": request.survey
        }
        postSendSMS.mutate(smsData, {
            onError: error => {
                console.log(error)
            },
            onSuccess: () => {
                console.log("SMS sent")
                reFetchRequest()
            }
        })
    }

    const setStatusError = () => {
        const supportNeedUpdate = {
            "contact": request.contact,
            "survey": request.survey,
            "category": request.category,
            "status": "-1",
            "updatedby": updatedBy
        }
        postSupportNeed.mutate(supportNeedUpdate, {
            onError: error => {
                console.log(error)
            },
            onSuccess:() => {
                console.log("Status changed to error")
                const postErrorTextAsComment = new Promise( resolve => {
                    postComment(errorMessageContent, resolve)
                })
                postErrorTextAsComment.then(()=> {
                    reFetchRequest()
                    reFetchRequestComments()
                    setShowErrorDialog(false)
                    setShowSetStatusSeen(false)
                    setShowErrorCompliment(true)
                })
            }
        })
    }

    const sendErrorMessageAndSetStatusError = () => {
        const emailData = {
            "subject": "[ID: "+request.id+"] New error report from "+updatedBy,
            "body": "<h1>Error Message</h1>" +
                "<p><em>" + errorMessageContent + "</em></p>" +
                "<table>" +
                "<tr><th>RequestId</th><td>" + request.id + "</td></tr>" +
                "<tr><th>Student</th><td>" + request.studentName + "</td></tr>" +
                "<tr><th>ContactId</th><td>" + request.contact + "</td></tr>" +
                "<tr><th>SurveyId</th><td>" + request.survey + "</td></tr>" +
                "<tr><th>Reporter</th><td>" + updatedBy + "</td></tr>" +
                "</table>"
        }
        postSendEmail.mutate(emailData, {
            onError: error => {
                console.log(error)
            },
            onSuccess: () => {
                console.log("Email sent")
                setStatusError()
            }
        })
    }

    const postComment = (comment, resolve) => {
        const commentData = {
            "supportneed": request.id,
            "body": comment,
            "updatedby": updatedBy
        }
        postSupportNeedComment.mutate(commentData, {
            onError: error => {
                console.log(error)
            },
            onSuccess:()=>{
                console.log("Comment: "+comment+" posted!")
                resolve()
            }
        })
    }

    const postSelectedComments = () => {
        if (customCommentContent.length > 0) {
            selectedComments.push(customCommentContent)
        }
        const commentPosts = selectedComments.reduce((postChain, comment) => {
            return postChain.then(() => new Promise(resolve => {
                postComment(comment, resolve)
            }))
        }, Promise.resolve())

        commentPosts.then(() => {
            setSelectedComments([])
            setShowCustomComment(false)
            setCustomCommentContent("")
            setShowAddComments(false)
            setShowCommentCompliment(true)
            reFetchRequestComments()
        })
    }

    const toggleCommentSelection = (option, i) => {
        if (selectedComments.includes(option)) {
            setSelectedComments(selectedComments.filter(comment => comment !== option))
        } else {
            setSelectedComments(selectedComments => [...selectedComments, option])
        }
    }

    const customCommentRef = useRef(null)

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside)

        function handleClickOutside(event) {
            if (customCommentRef.current && !customCommentRef.current.contains(event.target)) {
                if (showCustomComment && customCommentRef.current.value.length < 1) {
                    setShowCustomComment(false)
                }
            }
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    },[showCustomComment, customCommentContent, customCommentRef])

    return <div className={"request-actions"}>
        <div className={"request-actions-container"}>
            {showSetStatusSeen &&
            <>
                <button className={"primary main"} onClick={()=>setStatusSeen()}>
                    <SeenIcon />
                    {intl.formatMessage({
                        id: 'markAsSeen',
                        defaultMessage: 'Mark as seen',
                    })}
                </button>
                <button className={"no-background"} onClick={()=> {
                    setShowSetStatusSeen(false)
                    setShowErrorDialog(true)
                    setNavigateBackTo("setAsSeen")
                }}><ErrorIcon />
                    {intl.formatMessage({
                        id: 'reportError',
                        defaultMessage: 'Report error',
                    })}
                </button>
            </>
            }
            {showErrorDialog &&
                <div className={"error-report"}>
                    <textarea onChange={(e)=>setErrorMessageContent(e.target.value)} value={errorMessageContent} autoFocus={true}/>
                    {errorMessageContent.length > 0 ?
                        <button className={"main tertiary"} onClick={()=>sendErrorMessageAndSetStatusError()}><MailIcon />
                            {intl.formatMessage({
                                id: 'sendMessage',
                                defaultMessage: 'Send message',
                            })}
                        </button> :
                        <button className={"main tertiary"} disabled title={"Kirjoita ilmoitus ennen lähetystä"}><MailIcon />
                            {intl.formatMessage({
                                id: 'sendMessage',
                                defaultMessage: 'Send message',
                            })}
                        </button>
                    }
                    <button className={"no-background light"} onClick={()=>{
                        setShowErrorDialog(false)
                        navigateBackTo === "setAsSeen" && setShowSetStatusSeen(true)
                        navigateBackTo === "addComments" && setShowAddComments(true)
                    }}>
                        {intl.formatMessage({
                            id: 'cancel',
                            defaultMessage: 'Cancel',
                        })}
                    </button>
                </div>
            }
            {showAddComments &&
            <>
                <div className={"comment-options button-group"} role={"group"} aria-label={"Checkbox toggle button group"}>
                    {comments.map((option, i) => {
                        return <React.Fragment key={i}>
                            <input type={"checkbox"} id={"checkbox"+i} name={"checkbox"+i} checked={selectedComments.includes(option)} onChange={()=>toggleCommentSelection(option,i)}/>
                            <label className={"button round-button"} htmlFor={"checkbox"+i}>{option}</label>
                        </React.Fragment>
                    })}
                    {showCustomComment ?
                        <input type={"text"} ref={customCommentRef} className={"custom-comment"} placeholder={"Kirjoita kommentti"} autoFocus={true} value={customCommentContent} onChange={e=>setCustomCommentContent(e.target.value)} />
                    :
                        <button className={"round-button add-comment"} onClick={()=>setShowCustomComment(true)}>
                            {intl.formatMessage({
                                id: 'writeYourOwn',
                                defaultMessage: 'Write custom',
                            })}
                            <PenIcon /></button>
                    }
                </div>
                {selectedComments.length > 0 || customCommentContent.length > 0 ?
                    <button className={"main secondary"} onClick={()=>postSelectedComments()}><CommentIcon />
                        {intl.formatMessage({
                            id: 'addComments',
                            defaultMessage: 'Add comments',
                        })}
                    </button> :
                    <button className={"main secondary"} title={"Valitse ensin lisättävät kommentit"} disabled><CommentIcon />
                        {intl.formatMessage({
                            id: 'addComments',
                            defaultMessage: 'Add comments',
                        })}
                    </button>
                }
                <button className={"no-background"} onClick={()=> {
                    setShowAddComments(false)
                    setShowErrorDialog(true)
                    setNavigateBackTo("addComments")
                }}><ErrorIcon />
                    {intl.formatMessage({
                        id: 'reportError',
                        defaultMessage: 'Report error',
                    })}
                </button>
            </>
            }
            {showCommentCompliment &&
                <>
                    <div className={"high-five-container"}>
                        <div id={"high-five"}>
                            <HighFive />
                        </div>
                        <h4>
                            {intl.formatMessage({
                                id: 'thankYouForComments',
                                defaultMessage: 'Thank you for commenting',
                            })}
                        </h4>
                    </div>
                    <Link to={"/"} state={{navigated:true}} className={"button primary main"}><BackArrow />
                        {intl.formatMessage({
                            id: 'allSupportRequests',
                            defaultMessage: 'All support requests',
                        })}
                    </Link>
                    <button className={"no-background"} onClick={()=>{
                        setShowAddComments(true)
                        setShowCommentCompliment(false)
                    }}>
                        {intl.formatMessage({
                        id: 'addMoreComments',
                        defaultMessage: '+ Add more comments',
                    })}
                    </button>
                </>
            }
            {showErrorCompliment &&
            <>
                <div className={"high-five-container"}>
                    <div id={"error-boy"}>
                        <ErrorBoy />
                    </div>
                    <h4>
                        <FormattedMessage
                            id={"thankYouForErrorMessage"}
                            defaultMessage={"Thank you for reporting an error.{br}We'll check the situation."}
                            values={{br: <br/>}}/>
                    </h4>
                </div>
                <Link to={"/"} state={{navigated:true}} className={"button primary main"}><BackArrow />
                    {intl.formatMessage({
                        id: 'allSupportRequests',
                        defaultMessage: 'All support requests',
                    })}
                </Link>
                <button className={"no-background"} onClick={()=>{
                    setShowAddComments(true)
                    setShowErrorCompliment(false)
                }}>
                    {intl.formatMessage({
                        id: 'addMoreComments',
                        defaultMessage: '+ Add more comments',
                    })}
                </button>
            </>
            }
        </div>
    </div>
}

function SupportRequestSkeleton() {
    return <div className={"support-request skeleton-container"}>
        <div className={"support-request-header"}>
            <div>
                <Skeleton width={140} height={18} marginBottom={12}/>
                <Skeleton width={100} height={22} marginBottom={10}/>
                <Skeleton width={120} height={17}/>
            </div>
        </div>
        <div className={"student-info"}>
            <div>
                <table>
                    <thead>
                    <tr>
                        <th>
                            <Skeleton width={60} height={24}/>
                        </th>
                        <th>
                            <Skeleton width={60} height={24}/>
                        </th>
                        <th>
                            <Skeleton width={60} height={24}/>
                        </th>
                        <th>
                            <Skeleton width={60} height={24}/>
                        </th>
                        <th>
                            <Skeleton width={60} height={24}/>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>
                            <Skeleton width={120} height={17}/>
                        </td>
                        <td>
                            <Skeleton width={120} height={17}/>
                        </td>
                        <td>
                            <Skeleton width={120} height={17}/>
                        </td>
                        <td>
                            <Skeleton width={120} height={17}/>
                        </td>
                        <td>
                            <Skeleton width={120} height={17}/>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div className={"request-history-container"}>
            <div className={"request-history"}>
                <div className={"request-message date"}>
                    <Skeleton width={70} height={14}/>
                </div>
                <div className={"request-message message annie"}>
                    <Skeleton width={100} height={14}/>
                    <Skeleton width={390} height={14}/>
                    <Skeleton width={200} height={14} marginBottom={14}/>
                    <Skeleton width={20} height={14}/>
                    <Skeleton width={70} height={14}/>
                </div>
                <div className={"request-message message"}>
                    <Skeleton width={100} height={14}/>
                    <Skeleton width={50} height={14}/>
                </div>
                <div className={"request-message message annie"}>
                    <Skeleton width={100} height={14}/>
                    <Skeleton width={390} height={14}/>
                </div>
                <div className={"request-message system"}>
                    <Skeleton width={100} height={14}/>
                    <Skeleton width={180} height={14}/>
                </div>
            </div>
        </div>
        <div className={"request-actions"}>
            <div className={"request-actions-container"}>
                <button className={"main"}>
                    <Skeleton width={200} height={20} />
                </button>
                <button className={"no-background"}>
                    <Skeleton width={200} height={20} />
                </button>
            </div>
        </div>
    </div>
}

function NoRequestWithId() {
    const intl = useIntl()
    useEffect(() => {
        document.title = "404 | Annie Advisor"
    }, [])

    return <div className={"404"}>
        <h1>
            {intl.formatMessage({
                id: 'requestNotFoundHeader',
                defaultMessage: 'Couldnt access support request'
            })}
        </h1>
        <p>
            {intl.formatMessage({
                id: 'requestNotFoundText',
                defaultMessage: 'Either you dont have the rights to view this support request or it doesnt exist.'
            })}
        </p>
    </div>
}

function FailedToLoad() {
    const intl = useIntl()
    useEffect(() => {
        document.title = "Error | Annie Advisor"
    }, [])

    return <div className={"404"}>
        <h1>
            {intl.formatMessage({
                id: 'failedToLoadRequestHeader',
                defaultMessage: 'Failed to load support request'
            })}
        </h1>
        <p>
            {intl.formatMessage({
                id: 'failedToLoadRequestText',
                defaultMessage: 'Loading data for support request failed. Please try reloading.'
            })}
        </p>
    </div>
}

function StudentInfo({student, columnConfig}) {
    const intl = useIntl()
    const [studentInfo, setStudentInfo] = useState(
        localStorage.getItem("studentInfoSelections") ?
            JSON.parse(localStorage.getItem("studentInfoSelections")) :
        ["group","degree","location","phonenumber","email"]
    )
    //const string = JSON.stringify(studentInfo)
    //console.log(string, JSON.parse(string))
    const textTelOrMailto = e => e === "phonenumber" ? <a href={"tel:"+student.contact[e]}>{student.contact[e]}</a> : e === "email" ? <a href={"mailto:"+student.contact[e]}>{student.contact[e]}</a> : student.contact[e]

    return <>
        <div className={"student-info"}>
            <div>
                <div className={"table"}>
                    {studentInfo.map((e,i) => {
                        if (student.contact.hasOwnProperty(e)) {
                            return <div key={i}>
                                <div className={"th"}>{columnConfig.hasOwnProperty(e) && columnConfig[e].hasOwnProperty(intl.locale) ? columnConfig[e][intl.locale] : e}</div>
                                <div className={"td"}>{student.contact[e] ? textTelOrMailto(e) :
                                    <em>{intl.formatMessage({
                                        id: 'missingInfo',
                                        defaultMessage: 'Missing info',
                                    })}</em>}</div>
                            </div>
                        }
                        return null
                    })}
                </div>
                <StudentInfoSelector studentContact={student.contact} columnConfig={columnConfig} setInfoColumns={(e)=>setStudentInfo(e)}/>
            </div>
        </div>
    </>
}

function StudentInfoSelector({studentContact, columnConfig, setInfoColumns}) {
    const [showSelectorPopover, setShowSelectorPopover] = useState(false)
    const [selectedColumns, setSelectedColumns] = useState(
        localStorage.getItem("studentInfoSelections") ?
            JSON.parse(localStorage.getItem("studentInfoSelections")) :
            ["group","degree","location","phonenumber","email"])
    const popoverRef = useRef(null)
    const popoverTriggerRef = useRef(null)
    const intl = useIntl()

    const toggleColumnSelection = column => {
        if (selectedColumns.includes(column)) {
            setSelectedColumns(selectedColumns.filter(selected => selected !== column))
        } else {
            setSelectedColumns( selectedColumns => [...selectedColumns, column])
        }
    }

    const cancel = () => {
        setSelectedColumns(localStorage.getItem("studentInfoSelections") ?
            JSON.parse(localStorage.getItem("studentInfoSelections")) :
            ["group","degree","location","phonenumber","email"])
        setShowSelectorPopover(false)
    }

    const select = () => {
        localStorage.setItem("studentInfoSelections", JSON.stringify(selectedColumns))
        setInfoColumns(selectedColumns)
        setShowSelectorPopover(false)
    }

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside)
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target) && !popoverTriggerRef.current.contains(event.target) ) {
                cancel()
            }
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    },[popoverRef])

    return <div className={"selector-container"}>
        <button className={"icon-button"} ref={popoverTriggerRef} onClick={()=>setShowSelectorPopover(!showSelectorPopover)}>
            <MoreIcon />
        </button>
        {showSelectorPopover &&
            <>
                <div className={"overlay"}>
                    <div className={"selector-popover"} ref={popoverRef}>
                        <h1>{intl.formatMessage({
                            id: 'show',
                            defaultMessage: 'Show',
                        })}
                            <button className={"icon-button"} onClick={()=>cancel()}>
                            <CloseIcon />
                        </button></h1>
                        <ul>
                    {Object.keys(columnConfig).map((column, i) => {
                        return <li key={i} className={!studentContact.hasOwnProperty(column) ? "no-info" : ""}>
                            <input type={"checkbox"} id={"column"+i} name={"column"+i} checked={selectedColumns.includes(column)} onChange={()=>toggleColumnSelection(column,i)} />
                            <label htmlFor={"column"+i}>{columnConfig[column].hasOwnProperty(intl.locale) ? columnConfig[column][intl.locale] : columnConfig[column]["a"]}</label>
                        </li>
                    })}
                        </ul>
                        <div className={"options"}>
                            <button onClick={()=>cancel()}>{intl.formatMessage({
                                id: 'cancel',
                                defaultMessage: 'Cancel',
                            })}</button>
                            <button className="select" onClick={()=>select()}>{intl.formatMessage({
                                id: 'select',
                                defaultMessage: 'Select',
                            })}</button>
                        </div>
                    </div>
                </div>
            </>

        }
    </div>
}

function RequestHistory({request, codes, requestComments, requestHistory}) {
    const getRequestMessages = GetRequestMessages(request.contact)
    const error = getRequestMessages.status === "error"
    const loading = getRequestMessages.status === "loading"
    const success = getRequestMessages.status === "success"

    return <>
        <div className={"request-history-container"}>
            {error &&
                <h2>Error in loading request history</h2>
            }
            {loading &&
                <h2>Loading history</h2>
            }
            {success &&
            <RequestTimeline codes={codes}
                             requestMessages={getRequestMessages.data.filter(message => message.survey === request.survey)}
                             requestComments={requestComments}
                             requestHistory={requestHistory}
            />
            }
        </div>
    </>
}

function RequestTimeline({codes, requestMessages, requestComments, requestHistory}) {
    requestMessages.forEach(message => message.type = "message")
    requestComments.forEach(comment => comment.type = "comment")
    requestHistory.forEach(history => history.type = "system")
    const requestTimelineData = requestMessages.concat(requestComments, requestHistory)
    const sortedTimelineData = requestTimelineData.sort((a,b) => new Date(formatDate(a.updated)) - new Date(formatDate(b.updated)))
    const messagesLatestRef = useRef(null)
    const timelineRef = useRef(null)
    const scrollToLatest = () => {
        // messagesLatestRef.current?.scrollIntoView({block: 'end', inline: 'start', behavior: 'smooth'})
        timelineRef.current.scrollTop = timelineRef.current.scrollHeight
    }
    useEffect(() =>{
        scrollToLatest()
    }, [requestComments.length, requestMessages.length, requestHistory.length])

    return <>
        <div className={"request-history"} ref={timelineRef}>
            {sortedTimelineData.map((e,i) => {
                return <RequestMessage
                    request={e} codes={codes}
                    previousRequest={i !== 0 ? sortedTimelineData[i-1] : null} key={i}
                    systemRequests={requestHistory.sort((a,b) => new Date(formatDate(a.updated)) - new Date(formatDate(b.updated)))}
                    systemIndex={requestHistory.sort((a,b) => new Date(formatDate(a.updated)) - new Date(formatDate(b.updated))).indexOf(e)}
                />
            })}
            <div className={"scroll"} ref={messagesLatestRef} />
        </div>
    </>
}

function RequestMessage({request, codes, previousRequest, systemRequests, systemIndex}){
    const intl = useIntl()
    const isMessage = request.type === "message"
    const isSystemMessage = request.type === "system"
    const updated = new Date(formatDate(request.updated)).toLocaleString([intl.locale], {hour: '2-digit', minute:'2-digit'})
    const updateDate = new Date(formatDate(request.updated)).toLocaleString([intl.locale],
        {weekday: "short",
                year: "numeric",
                month: "2-digit",
                day: "numeric"})
    const previousUpdateDate = previousRequest ? new Date(formatDate(previousRequest.updated)).toLocaleString([intl.locale],
        {weekday: "short",
            year: "numeric",
            month: "2-digit",
            day: "numeric"}) : null
    // If updater has only email and no firstname lastname. Display that email. Otherwise display name
    const updatedBy = isMessage ? request.sender :
        request.updatedby.startsWith("(") && request.updatedby.endsWith(")") ?
            request.updatedby.slice(1,-1) : request.updatedby.replace(/\s*\(.*?\)\s*/g, '')
    const messageType = isMessage ? request.sender === "Annie" ? "message annie" : "message" : isSystemMessage && request.status === "100" ? request.type + " seen" : isSystemMessage && request.status === "-1" ? request.type + " error" : request.type
    const previousSystemRequest = isSystemMessage && systemIndex > 0 ? systemRequests[systemIndex - 1] : null
    const requestStatusName = (status) => {
        if (status === "100") {
            return intl.formatMessage({
                id: 'seen',
                defaultMessage: 'Seen',
            })
        }
        if (status === "2") {
            return intl.formatMessage({
                id: 'open',
                defaultMessage: 'Open',
            })
        }
        if (status === "1") {
            return intl.formatMessage({
                id: 'new',
                defaultMessage: 'New',
            })
        }
        return status
    }
    const requestText = isSystemMessage ?
        previousSystemRequest && request.category !== previousSystemRequest.category ?
            <>{intl.formatMessage({
                id: 'changedSubjectTo',
                defaultMessage: 'Changed subject to:',
            })} <em>{codes.hasOwnProperty([request.category]) ? codes[request.category].fi : intl.formatMessage({
                id: 'missingSubject',
                defaultMessage: 'Missing subject',
            })}</em></> :
            systemIndex === 0 ?
                intl.formatMessage({
                    id: 'supportRequestCreated',
                    defaultMessage: 'Support request created',
                }) :
                request.status === "100" ?
                    intl.formatMessage({
                        id: 'markedRequestSeen',
                        defaultMessage: 'Marked request seen',
                    }) :
                    request.status === "-1" ?
                        intl.formatMessage({
                            id: 'reportedAnError',
                            defaultMessage: 'Reported an error',
                        }) :
                    <>{intl.formatMessage({
                        id: 'changedStatusTo',
                        defaultMessage: 'Changed status to:',
                    })} <em>{requestStatusName(request.status)}</em></> :
        null
    const statusChangeToOpen = isSystemMessage && request.status === "2"

    return <>
        {(updateDate !== previousUpdateDate) && !statusChangeToOpen &&
        <div className={"request-message date"}>
            <p>{updateDate}</p>
        </div>
        }
        {!statusChangeToOpen &&
        <div className={"request-message "+messageType}>
            <p className={"sender"}>{updatedBy}<span className={"date"}>{updated}</span></p>
            {isSystemMessage ?
                <p>{requestText}</p> :
                <p>{request.body}</p>
            }
        </div>
        }
    </>
}

function GetRequestWithId(requestId) {
    const getSupportNeed = GetSupportNeed(requestId)
    const getContacts = GetContacts()
    const getCodes = GetCodes()
    const getComments = GetCommentOptions()
    const getColumnConfig = GetColumnConfig()
    const getRequestComments = GetRequestComments(requestId)
    const intl = useIntl()

    const loading = getSupportNeed.status === "loading" || getContacts.status === "loading" || getCodes.status === "loading" || getComments.status === "loading" || getColumnConfig.status === "loading" || getRequestComments.status === "loading"
    const error = getSupportNeed.status === "error" || getContacts.status === "error" || getCodes.status === "error" || getComments.status === "error" || getColumnConfig.status === "error" || getRequestComments.status === "error"
    const success = getSupportNeed.status === "success" && getContacts.status === "success" && getCodes.status === "success" && getComments.status === "success" && getColumnConfig.status === "success" && getRequestComments.status === "success"

    if (loading) {
        return {status: "loading", data:{}}
    }
    if (error) {
        return {status: "error", data:{}}
    }
    if (success) {
        if (getSupportNeed.data.length === 0) {
            return {status: "404", data:{}}
        } else {
            let request
            request = getSupportNeed.data.filter(obj => obj.current)[0]
            request.student = getStudentFromContacts(request.contact, getContacts.data)
            request.studentName = request.student.contact.firstname + " " + request.student.contact.lastname
            request.categoryName = getCodes.data[0].hasOwnProperty(request.category) ? getCodes.data[0][request.category][intl.locale] : null
            return {
                status: "success",
                data: {
                    request: request,
                    requestHistory: getSupportNeed.data,
                    requestComments: getRequestComments.data,
                    codes: getCodes.data ? getCodes.data[0] : {},
                    comments: getComments.data ? getComments.data[0].value : [],
                    columns: getColumnConfig.data ? getColumnConfig.data[0].value : {}
                },
                reFetchSupportNeed: () => {
                    getSupportNeed.refetch()
                },
                reFetchRequestComments: () => {
                    getRequestComments.refetch()
                }
            }
        }
    }
}
