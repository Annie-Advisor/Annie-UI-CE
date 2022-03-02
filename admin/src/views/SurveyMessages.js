import {useIntl} from "react-intl";
import React, {useEffect, useRef, useState} from "react";
import '../scss/SurveyMessages.scss';
import {shadeColor} from "../Formats";
import {Editor, EditorState, ContentState} from 'draft-js';
import 'draft-js/dist/Draft.css';
import {ReactComponent as OptionsIcon} from "../svg/options.svg";
import {ReactComponent as DeleteIcon} from "../svg/delete.svg";
import {ReactComponent as ShowExtraIcon} from "../svg/show-extra.svg";
import {ReactComponent as ReplyIcon} from "../svg/reply.svg";
import {ReactComponent as SupportIcon} from "../svg/support.svg";
import {ReactComponent as ErrorIcon} from "../svg/error.svg";
import {ReactComponent as MessageIcon} from "../svg/message.svg";
import {ReactComponent as ConfirmIcon} from "../svg/confirm.svg";
import {ReactComponent as CancelIcon} from "../svg/cancel.svg";
import {getBranchIconColor, getMessageIcon, Modal, Popover, Popup} from "../UIElements";
import {useCodesData, useSurveyData, useUserSurveyData} from "./SurveyView";
import {changeBranchName, getConditionForBranchName, nextBranchName, setSupportNeedStatus} from "../DataFunctions";
import {SupportNeedSelector, SupportProviderSelector} from "./SurveySupportNeeds";
import {ReactComponent as ProviderIcon} from "../svg/provider.svg";

export default function SurveyMessages() {
    const {surveyData} = useSurveyData()
    const intl = useIntl()
    const surveyFinished = surveyData.status === "FINISHED"
    const branches = Object.keys(surveyData.config).filter(key => key.startsWith('branch') || key === 'other')

    return <>
        <h4>
            {intl.formatMessage(
                {
                    id: 'survey.navigation.messages',
                    defaultMessage: 'Messages',
                })}
        </h4>
        <div className={"messages-container"}>
            <div className={"message-group first"}>
                <div className={"message-card"}>
                    <div className={"message-header"}>
                        <div className={"icon"}>
                            <MessageIcon />
                            {intl.formatMessage({id:'survey.firstMessage',defaultMessage:'First message'})}
                        </div>
                    </div>
                    <div className={"message-text"} disabled={surveyFinished}>
                        <EditableContent text={surveyData.config.message} data={surveyData.config} keyValue={"message"} message={"firstMessage"}
                                         depth={0}/>
                    </div>
                </div>
                <div className={branches.length > 0 ? "message-children line": "message-children"}>
                    <GetMessages data={surveyData.config} depth={1} />
                    {!surveyFinished &&
                    <MessageToolbar data={surveyData.config} depth={1}/>
                    }
                </div>
            </div>
        </div>
    </>
}

function GetMessages(props) {
    return <>
        {Object.keys(props.data).filter(key => key.startsWith('branch') || key === 'other').sort()
            .map( (keyValue, i) => {
                if (props.data[keyValue].condition === ".*") {
                    return <Message message={"replyMessage"} data={props.data} parentColor={props.parentColor} keyValue={keyValue} i={i} key={props.parent+keyValue} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
                }
                switch (keyValue) {
                    case "other":
                        return <Message message={"errorMessage"} data={props.data} parentColor={props.parentColor} keyValue={keyValue} i={i} key={props.parent+keyValue} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
                    default:
                        return <Message data={props.data} parentColor={props.parentColor} keyValue={keyValue} i={i} key={props.parent+keyValue} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
                }
            })}
    </>
}

function Message(props) {
    const intl = useIntl()
    let isBranch = props.keyValue.startsWith('branch')
    let icon = getMessageIcon(props, isBranch)
    let color = getBranchIconColor(props, isBranch)
    const {surveyData} = useSurveyData()
    const surveyFinished = surveyData.status === "FINISHED"
    const branches = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch') || key === 'other')
    let branchText = ""
    if (props.keyValue === "other") {
        branchText = intl.formatMessage({id: 'survey.message.other', defaultMessage: 'Error message'})
    }
    if (props.data.condition === ".*") {
        branchText = intl.formatMessage({id: 'survey.message.reply', defaultMessage: 'Reply'})
    }

    let childDoesntHaveReply
    let childBranches = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch'))
    if (childBranches.length < 1) {
        childDoesntHaveReply = true
    } else {
        const hasReply = childBranches.some(childBranch => props.data[props.keyValue][childBranch].condition === ".*")
        childDoesntHaveReply = !hasReply
    }
    const showToolbar = childDoesntHaveReply && !surveyFinished && isBranch && props.data[props.keyValue].condition !== ".*"

    return <div className={"message-group"} key={props.i}>
        <div className={"message-card"}>
            <div className={"message-header"} style={{backgroundColor: color}}>
                <div className={"icon"}>
                    {isBranch && props.data[props.keyValue].condition !== '.*' ?
                        <BranchEditor data={props.data} keyValue={props.keyValue} depth={props.depth} parent={props.parent}
                                      parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent} /> :
                        icon
                    }
                    {branchText}
                </div>
            </div>
            <div className={"message-text"} disabled={surveyFinished}>
                <EditableContent message={props.message} text={props.data[props.keyValue].message} data={props.data}
                                 keyValue={props.keyValue} depth={props.depth} parent={props.parent}
                                 parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
            </div>
            <SupportNeedTools data={props.data} keyValue={props.keyValue} depth={props.depth} parent={props.parent}
                              parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
        </div>
        {branches.length > 0 ?
            <div className={branches.length > 0 ? "message-children line" : "message-children"}>
                <GetMessages data={props.data[props.keyValue]} parentColor={color} depth={props.depth + 1}
                             parent={props.keyValue} parentsParent={props.parent}
                             parentsParentsParent={props.parentsParent}/>
                {showToolbar &&
                <MessageToolbar data={props.data} keyValue={props.keyValue} parentColor={color} depth={props.depth + 1}
                                parent={props.keyValue} parentsParent={props.parent}
                                parentsParentsParent={props.parentsParent}/>
                }
            </div> : showToolbar &&
            <MessageToolbar data={props.data} keyValue={props.keyValue} parentColor={color} depth={props.depth + 1}
                            parent={props.keyValue} parentsParent={props.parent}
                            parentsParentsParent={props.parentsParent}/>
        }
    </div>
}

function BranchEditor(props) {
    const {surveyData, setSurveyData} = useSurveyData()
    const originalBranchName = props.keyValue.slice(6)
    const [branchName, setBranchName] = useState(originalBranchName)
    const [showConfirm, setShowConfirm] = useState(false)
    const branchNameError = branchName.length < 1 || branchNameIsNotUnique(surveyData.config)
    const inputClass = branchNameError ? "error" : showConfirm ? "active" : ""

    function branchNameIsNotUnique(data) {
        const branches = Object.keys(data).filter(key => key.startsWith('branch'))
        if (branches.some(branch => {
            if (branchName !== originalBranchName) {
                return branch === "branch" + branchName
            }
        })) {
            return true
        }
        return branches.some(branch => branchNameIsNotUnique(data[branch]))
    }

    const changeBranch = e => {
        e.preventDefault()
        const newBranch = "branch"+branchName
        const newSurveyData = {...surveyData}
        changeBranchName(newBranch, newSurveyData.config, props.depth, props.keyValue, props.parent, props.parentsParent, props.parentsParentsParent)
        setSurveyData(newSurveyData)
        setShowConfirm(false)
    }

    return <form className={"branch-editor"} onSubmit={branchNameError ? null : changeBranch}>
        <input type={"text"}
               title={branchNameError ? "Option taken": ""}
               className={inputClass}
               value={branchName}
               onChange={e => {
                   setBranchName(e.target.value)
                   setShowConfirm(true)
               }}
        />
        {showConfirm &&
        <>
            <button className={"cancel"} title={"cancel"} onClick={()=>{
                setBranchName(originalBranchName)
                setShowConfirm(false)
            }}>
                <CancelIcon />
            </button>
            {!branchNameError &&
            <button className={"confirm"} type={"submit"} title={"confirm"}>
                <ConfirmIcon />
            </button>
            }
        </>
        }
    </form>
}

function SupportNeedTools(props) {
    const {surveyData, setSurveyData} = useSurveyData()
    const {userSurveyData} = useUserSurveyData()
    const surveyFinished = surveyData.status === "FINISHED"
    const limitedEditing = surveyData.status === "IN PROGRESS" || surveyData.status === "FINISHED"
    const {codesData} = useCodesData()
    const intl = useIntl()
    const [showPopup, setShowPopup] = useState(false)
    const [showSupportNeedSelector, setShowSupportNeedSelector] = useState(false)
    const [showSupportProviderSelector, setShowSupportProviderSelector] = useState(false)
    const hasSupportNeed = props.data[props.keyValue].hasOwnProperty('supportneed') && props.data[props.keyValue]["supportneed"]
    const hasCategoryName = codesData.hasOwnProperty(props.data[props.keyValue].category)
    const categoryName = hasCategoryName && props.data[props.keyValue].category
    const topicSupportProviders = userSurveyData.filter(user => user.meta.hasOwnProperty("category") && user.meta.category[props.data[props.keyValue].category])

    let locale = (intl.locale === "es" || intl.locale === "it") ? "en" : intl.locale

    const toggleSupportNeed = props => {
        const newSurveyData = {...surveyData}
        setSupportNeedStatus(hasSupportNeed, newSurveyData.config, props.depth, props.keyValue, props.parent, props.parentsParent, props.parentsParentsParent)
        setSurveyData(newSurveyData)
    }

    const inputId =  props.parent ? props.keyValue +"-"+ props.depth.toString() + "-" + props.parent : props.keyValue +"-"+ props.depth.toString()

    const supportNeedName = hasCategoryName ? codesData[props.data[props.keyValue].category][locale] :
        intl.formatMessage({
            id: 'survey.chooseSupportNeed',
            defaultMessage: '+ Choose Support Topic',
        })

    return <>
        <div className={"message-support-need"}>
            <div className={"support-need-toggle"}>
            <SupportIcon/>
            {surveyFinished ?
                <>
                    <input disabled readOnly={true} type={"checkbox"} className={"switch"} id={inputId} defaultChecked={hasSupportNeed}/>
                    <label htmlFor={inputId} className={"switch-label"} />
                    {hasSupportNeed &&
                    <>
                        <button title={supportNeedName} className={hasCategoryName ? "block" : "block not-assigned"} disabled>
                            {supportNeedName}
                        </button>
                    </>
                    }
                </> :
                <>
                    <input type={"checkbox"} onChange={()=>toggleSupportNeed(props)} className={"switch"} id={inputId} defaultChecked={hasSupportNeed}/>
                    <label htmlFor={inputId} className={"switch-label"} />
                    {hasSupportNeed &&
                    <>
                    <button title={supportNeedName} className={hasCategoryName ? "block" : "block not-assigned"} onClick={() => {
                        setShowSupportNeedSelector(true)
                        setShowPopup(true)
                    }}>
                        {supportNeedName}
                    </button>
                    </>
                    }
                </>
            }
            </div>
            {hasSupportNeed &&
            <div className={"support-providers"}>
                <ProviderIcon/>
                {hasCategoryName ?
                <button className={topicSupportProviders.length > 0 ? "block support-provider" : "block not-assigned"} onClick={() => {
                    setShowSupportProviderSelector(true)
                    setShowPopup(true)
                }}>
                    {topicSupportProviders.length > 0 ? topicSupportProviders.length :
                        intl.formatMessage({
                            id: 'survey.assign',
                            defaultMessage: '+ Assign',
                        })
                    }
                </button> :
                    <p className={"placeholder"}>
                        {intl.formatMessage({
                            id: 'survey.supportNeeds.addTopicFirst',
                            defaultMessage: 'Add topic first',
                        })}
                    </p>
                }
            </div>
            }
            {!limitedEditing &&
            <DeleteMessage data={props.data} keyValue={props.keyValue} depth={props.depth}
                           parent={props.parent}
                           parentsParent={props.parentsParent}
                           parentsParentsParent={props.parentsParentsParent} />
            }
        </div>
        {showPopup &&
        <Popup closePopup={() => {
            setShowPopup(false)
            setShowSupportNeedSelector(false)
            setShowSupportProviderSelector(false)
        }}>
            {showSupportNeedSelector &&
            <SupportNeedSelector need={props} closePopup={() => {
                setShowPopup(false)
                setShowSupportNeedSelector(false)
            }} hideRemoveSupportNeed={true}/>
            }
            {showSupportProviderSelector &&
            <SupportProviderSelector group={categoryName} hidePopup={()=> {
                setShowPopup(false)
                setShowSupportProviderSelector(false)
            }}/>
            }
        </Popup>
        }
    </>
}

function EditableContent(props) {
    // TODO: check if code can be refactored, so that the nested level of the edited object is not done manually
    const {surveyData, setSurveyData} = useSurveyData()
    const surveyFinished = surveyData.status === "FINISHED"
    const intl = useIntl()
    const [editorState, setEditorState] = useState(
        () => EditorState.createWithContent(ContentState.createFromText(props.text)),
    )
    // Fixed bug where the text prop was different than the editors state when adding a new branch
    if (editorState.getCurrentContent().getPlainText() !== props.text) {
        setEditorState(EditorState.createWithContent(ContentState.createFromText(props.text)))
    }
    let placeholderText
    switch (props.message) {
        case "firstMessage":
            placeholderText =  intl.formatMessage({
                id: 'survey.message.placeholder.first',
                defaultMessage: 'This is the first message to the student! Click to type, and maybe start with a greeting? :)',
            })
            break
        case "errorMessage":
            placeholderText =  intl.formatMessage({
                id: 'survey.message.placeholder.error',
                defaultMessage: 'Write an error message for mistyped answers',
            })
            break
        case "replyMessage":
            placeholderText =  intl.formatMessage({
                id: 'survey.message.placeholder.reply',
                defaultMessage: 'Type a finishing reply or a thank you for answering',
            })
            break
        default:
            placeholderText =  intl.formatMessage({
                id: 'survey.message.placeholder',
                defaultMessage: 'Click to type your message',
            })
    }

    const editorUpdate = e => {
        setEditorState(e)
        const newSurveyData = {...surveyData}
        if (props.depth === 0) {
            newSurveyData.config.message = e.getCurrentContent().getPlainText()
        }
        if (props.depth === 1) {
            newSurveyData.config[props.keyValue].message = e.getCurrentContent().getPlainText()
        }
        if (props.depth === 2) {
            newSurveyData.config[props.parent][props.keyValue].message = e.getCurrentContent().getPlainText()
        }
        if (props.depth === 3) {
            newSurveyData.config[props.parentsParent][props.parent][props.keyValue].message = e.getCurrentContent().getPlainText()
        }
        if (props.depth === 4) {
            newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent][props.keyValue].message = e.getCurrentContent().getPlainText()
        }
        setSurveyData(newSurveyData)

    }
    return <>{surveyFinished ?
        <Editor editorState={editorState} readOnly={true} disabled placeholder={placeholderText} stripPastedStyles={true}/> :
        <Editor editorState={editorState} onChange={editorUpdate} placeholder={placeholderText} stripPastedStyles={true}/>
    }
    </>
}

function DeleteMessage(props) {
    const intl = useIntl()
    const {surveyData, setSurveyData} = useSurveyData()
    const [modalOpen, setModalOpen] = useState(false)
    const deleteMessage = () => {
        const newSurveyData = {...surveyData}
        if (props.depth === 1) {
            delete newSurveyData.config[props.keyValue]
        }
        if (props.depth === 2) {
            delete newSurveyData.config[props.parent][props.keyValue]
        }
        if (props.depth === 3) {
            delete newSurveyData.config[props.parentsParent][props.parent][props.keyValue]
        }
        if (props.depth === 4) {
            delete newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent][props.keyValue]
        }
        setSurveyData(newSurveyData)
        setModalOpen(false)
    }
    return <>
        <button className={"delete icon"} title={intl.formatMessage(
            {
                id: 'survey.message.deleteMessage',
                defaultMessage: 'Delete Message',
            })}
             onClick={() => {
            setModalOpen(true)
        }}>
            <DeleteIcon/>
        </button>
        {modalOpen &&
        <Modal
            header={intl.formatMessage(
                {
                    id: 'survey.message.delete.header',
                    defaultMessage: "Are you sure you want to delete this step?",
                })}
            text={intl.formatMessage(
                {
                    id: 'survey.message.delete.text',
                    defaultMessage: "This will delete chosen step and it's children. You can't undo this action.",
                })}
            confirmText={intl.formatMessage(
                {
                    id: 'survey.message.delete',
                    defaultMessage: 'Delete',
                })}
            alert
            closeModal={() => {setModalOpen(false)}}
            confirmAction={() => deleteMessage()}
        />
        }
    </>
}

function OptionsPopUp(props) {
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)
    const intl = useIntl()
    const {surveyData, setSurveyData} = useSurveyData()
    let isBranch = props.keyValue.startsWith('branch')
    let branches = Object.keys(props.data).filter(key => key.startsWith('branch'))
    let lastBranch = branches[branches.length -1]
    let isLastBranch = lastBranch === props.keyValue
    const deleteMessage = () => {
        const newSurveyData = {...surveyData}
        if (props.depth === 1) {
            delete newSurveyData.config[props.keyValue]
        }
        if (props.depth === 2) {
            delete newSurveyData.config[props.parent][props.keyValue]
        }
        if (props.depth === 3) {
            delete newSurveyData.config[props.parentsParent][props.parent][props.keyValue]
        }
        if (props.depth === 4) {
            delete newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent][props.keyValue]
        }
        setSurveyData(newSurveyData)
        setConfirmModalOpen(false)
    }
    if (!isBranch || isLastBranch) {
        return <div className={"options-popover popover-container"}>
            <div className={"popover-toggle"} onClick={() => setPopoverOpen(true)}>
                <OptionsIcon/>
            </div>
            {popoverOpen &&
            <Popover closePopover={() => setPopoverOpen(false)}>
                <div className={"delete"} onClick={() => {
                    setConfirmModalOpen(true)
                    setPopoverOpen(false)
                }}>
                    <DeleteIcon/>
                    {intl.formatMessage(
                        {
                            id: 'survey.message.deleteMessage',
                            defaultMessage: 'Delete Message',
                        })}
                </div>
            </Popover>
            }
            {confirmModalOpen &&
            <Modal header={intl.formatMessage(
                {
                    id: 'survey.message.delete.header',
                    defaultMessage: "Are you sure you want to delete this step?",
                })}
                   text={intl.formatMessage(
                       {
                           id: 'survey.message.delete.text',
                           defaultMessage: "This will delete chosen step and it's children. You can't undo this action.",
                       })}
                   confirmText={intl.formatMessage(
                       {
                           id: 'survey.message.delete',
                           defaultMessage: 'Delete',
                       })}
                   alert
                   closeModal={() => {
                       setConfirmModalOpen(false)
                   }} confirmAction={() => deleteMessage()}/>
            }
        </div>
    }
    return null
}

function MessageToolbar(props) {
    //TODO: Refactor to remove repetition
    const [toolbarOpen, setToolbarOpen] = useState(false)
    const {surveyData, setSurveyData} = useSurveyData()
    const intl = useIntl()
    const refToolbar = useRef(null)
    useEffect(()=>{
        document.addEventListener("mousedown", handleClickOutside)
        function handleClickOutside(event) {
            if (refToolbar.current && !refToolbar.current.contains(event.target)) {
                setToolbarOpen(false)
            }
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    },[refToolbar, toolbarOpen])

    let color
    if (props.parentColor) {
        color = shadeColor(props.parentColor, -5)
    } else {
        color = "#BFBFBF"
    }
    let branches
    if (props.depth === 1) {
        branches = Object.keys(props.data).filter(key => key.startsWith('branch'))
    } else {
        branches = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch'))
    }
    const nextBranch = nextBranchName(branches, props.keyValue)

    color = getBranchIconColor(props.data, true, nextBranch)

    const addBranch = (type) => {
        const newSurveyData = {...surveyData}
        const condition = type === "reply" ? ".*" : getConditionForBranchName(nextBranch)
        const branchType = type === "other" ? "other" : nextBranch
        const objectContent = type === "other" ?
            {
                message: ""
            } :
            {
                condition: condition,
                message: ""
            }

        if (props.depth === 1) {
            newSurveyData.config[branchType] = objectContent
        }
        if (props.depth === 2) {
            newSurveyData.config[props.keyValue][branchType] = objectContent
        }
        if (props.depth === 3) {
            newSurveyData.config[props.parentsParent][props.parent][branchType] = objectContent
        }
        if (props.depth === 4) {
            newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent][branchType] = objectContent
        }
        setSurveyData(newSurveyData)
    }

    let hasOtherOption
    if (props.depth === 1) {
        hasOtherOption = props.data.hasOwnProperty("other")
    } else {
        hasOtherOption = props.data[props.parent].hasOwnProperty("other")
    }

    let optionLimitFull
    if (props.depth === 1) {
        optionLimitFull = Object.keys(props.data).filter(key => key.startsWith('branch')).length > 25
    } else {
        optionLimitFull = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch')).length > 8
    }

    let hasBranches
    if (props.depth === 1) {
        hasBranches = Object.keys(props.data).filter(key => key.startsWith('branch')).length > 0
    } else {
        hasBranches = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch')).length > 0
    }

    return <div className="message-toolbar" ref={refToolbar}>
        {!toolbarOpen &&
        <button className={"add-step"} onClick={() => setToolbarOpen(true)}>
            +
        </button>
        }
        {toolbarOpen &&
        <div className={"toolbar-option"}>
            {props.depth < 5 && !optionLimitFull &&
            <button className={"option"} style={{backgroundColor: color}} onClick={() => {
                addBranch("branch")
                !hasOtherOption && addBranch("other")
            }}>
                <span className={"icon"}>{nextBranch.slice(6)}</span>
                {intl.formatMessage(
                    {
                        id: 'survey.message.option',
                        defaultMessage: 'Option',
                    })}
            </button>
            }
            {!hasOtherOption &&
            <button className={"option"} onClick={() => addBranch("other")}>
                <span className={"icon"}><ErrorIcon /></span>
                {intl.formatMessage(
                    {
                        id: 'survey.message.other',
                        defaultMessage: 'Error message',
                    })}
            </button>
            }
            {!hasOtherOption && !hasBranches &&
            <button className={"option"} onClick={() => addBranch("reply")}>
                <span className={"icon"}><ReplyIcon/></span>
                {intl.formatMessage(
                    {
                        id: 'survey.message.reply',
                        defaultMessage: 'Reply',
                    })}
            </button>
            }
            <button className={"close"} onClick={() => setToolbarOpen(false)}>
                {intl.formatMessage(
                    {
                        id: 'survey.message.close',
                        defaultMessage: 'Close',
                    })}
            </button>
        </div>
        }
    </div>
}