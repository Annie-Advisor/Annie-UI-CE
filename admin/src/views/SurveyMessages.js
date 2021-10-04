import {useIntl} from "react-intl";
import React, {useState} from "react";
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
import {getBranchIconColor, getMessageIcon, Modal, Popover, Popup} from "../UIElements";
import {useCodesData, useSurveyData} from "./SurveyView";
import {setSupportNeedStatus} from "../DataFunctions";
import {SupportNeedSelector} from "./SurveySupportNeeds";

export default function SurveyMessages() {
    const {surveyData} = useSurveyData()
    const [messageContentOpen, setMessageContentOpen] = useState(true)
    const intl = useIntl()

    return <>
        <h4>
            {intl.formatMessage(
                {
                    id: 'survey.navigation.messages',
                    defaultMessage: 'Messages',
                })}
        </h4>
        <div className={"messages"}>
            {messageContentOpen ? <>
                <div className={"message-container has-steps"}>
                    <div className={"message"}>
                        <div className={"message-icon"} onClick={() => setMessageContentOpen(!messageContentOpen)}>
                            <MessageIcon />
                        </div>
                        <div className={"message-content"}>
                            <EditableContent text={surveyData.config.message} data={surveyData.config} keyValue={"message"} message={"firstMessage"}
                                             depth={0}/>
                        </div>
                    </div>
                    <div className={"message-children"}>
                        <GetMessages data={surveyData.config} depth={1} />
                    </div>
                    <MessageToolbar data={surveyData.config} depth={1}/>
                </div>
                </> :
                <div className={"message"}>
                    <div className={"message-icon"} onClick={() => setMessageContentOpen(!messageContentOpen)}>
                        <MessageIcon />
                    </div>
                    <div className={"show-message"} onClick={() => setMessageContentOpen(true)}>
                        <ShowExtraIcon />
                    </div>
                </div>
            }
        </div>
    </>
}

function GetMessages(props) {
    return <>
        {Object.keys(props.data).filter(key => key.startsWith('branch') || key === 'other').sort()
            .map( (keyValue, i) => {
                if (props.data[keyValue].condition === ".*") {
                    return <Message message={"replyMessage"} data={props.data} parentColor={props.parentColor} keyValue={keyValue} i={i} key={i} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
                }
                switch (keyValue) {
                    case "other":
                        return <Message message={"errorMessage"} data={props.data} parentColor={props.parentColor} keyValue={keyValue} i={i} key={i} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
                    default:
                        return <Message data={props.data} parentColor={props.parentColor} keyValue={keyValue} i={i} key={i} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
                }
            })}
    </>
}

function Message(props) {
    const [messageContentOpen, setMessageContentOpen] = useState(true)
    let isBranch = props.keyValue.startsWith('branch')
    let icon = getMessageIcon(props, isBranch)
    let color = getBranchIconColor(props, isBranch)

    let childDoesntHaveReply
    let childBranches = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch'))
   if (childBranches.length < 1) {
       childDoesntHaveReply = true
   } else {
       const hasReply = childBranches.some(childBranch => props.data[props.keyValue][childBranch].condition === ".*")
       childDoesntHaveReply = !hasReply
   }
    let messageContent
    if (messageContentOpen) {
        messageContent = <><div className={"message"}>
            <div className={"message-icon"} onClick={() => setMessageContentOpen(!messageContentOpen)} style={{backgroundColor:color}}>{icon}</div>
            <div className={"message-content"}>
                <div>
                    <EditableContent message={props.message} text={props.data[props.keyValue].message} data={props.data} keyValue={props.keyValue} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
                    <OptionsPopUp data={props.data} keyValue={props.keyValue} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
                </div>
                <SupportNeedTools data={props.data} keyValue={props.keyValue} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
            </div>
        </div>
        {
            isBranch && props.data[props.keyValue].condition !== ".*" &&
            <>
                <div className={childDoesntHaveReply ? "message-children" : "message-children no-toolbar"}>
                    <GetMessages data={props.data[props.keyValue]} parentColor={color} depth={props.depth + 1} parent={props.keyValue} parentsParent={props.parent} parentsParentsParent={props.parentsParent}/>
                </div>
                {childDoesntHaveReply &&
                <MessageToolbar data={props.data} keyValue={props.keyValue} parentColor={color} depth={props.depth + 1}
                                parent={props.keyValue} parentsParent={props.parent}
                                parentsParentsParent={props.parentsParent}/>
                }
            </>
        }
        </>
    } else {
        messageContent = <div className={"message"}>
            <div className={"message-icon"} onClick={() => setMessageContentOpen(!messageContentOpen)} style={{backgroundColor:color}}>{icon}</div>
            <div className={"show-message"} onClick={() => setMessageContentOpen(true)}>
                <ShowExtraIcon />
            </div>
        </div>
    }

    return <div className={isBranch ? "message-container has-steps" : "message-container"} key={props.i}>
        {messageContent}
    </div>
}

function SupportNeedTools(props) {
    const {surveyData, setSurveyData} = useSurveyData()
    const {codesData} = useCodesData()
    const intl = useIntl()
    const [showPopup, setShowPopup] = useState(false)
    let hasSupportNeed = props.data[props.keyValue].hasOwnProperty('supportneed') && props.data[props.keyValue]["supportneed"]
    let hasCategoryName = codesData.hasOwnProperty(props.data[props.keyValue].category)

    const toggleSupportNeed = props => {
        const newSurveyData = {...surveyData}
        setSupportNeedStatus(hasSupportNeed, newSurveyData.config, props.depth, props.keyValue,  props.parent, props.parentsParent, props.parentsParentsParent)
        setSurveyData(newSurveyData)
    }

    const inputId =  props.parent ? props.keyValue +"-"+ props.depth.toString() + "-" + props.parent : props.keyValue +"-"+ props.depth.toString()

    return <>
        <div className={"support-need-tools"}>
            <SupportIcon/>
            <input type={"checkbox"} onChange={()=>toggleSupportNeed(props)} className={"switch"} id={inputId} defaultChecked={hasSupportNeed}/>
            <label htmlFor={inputId} className={"switch-label"} />
            {hasSupportNeed &&
                <div className={hasCategoryName ? "block" : "block not-assigned"} onClick={() => setShowPopup(true)}>
                    {hasCategoryName ? codesData[props.data[props.keyValue].category][intl.locale] :
                        intl.formatMessage({
                                id: 'survey.chooseSupportNeed',
                                defaultMessage: '+ Choose Support Need',
                            })
                    }
                </div>
            }
        </div>
        {showPopup &&
        <Popup closePopup={() => setShowPopup(false)}>
            <SupportNeedSelector need={props} closePopup={() => setShowPopup(false)}/>
        </Popup>
        }
    </>
}

function EditableContent(props) {
    // TODO: check if code can be refactored, so that the nested level of the edited object is not done manually
    const {surveyData, setSurveyData} = useSurveyData()
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
    return <Editor editorState={editorState} onChange={editorUpdate} placeholder={placeholderText} stripPastedStyles={true}/>
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
    let color
    if (props.parentColor) {
        color = shadeColor(props.parentColor, -5)
    } else {
        color = "#BFBFBF"
    }
    let nextBranch
    if (props.depth === 1) {
        let branches = Object.keys(props.data).filter(key => key.startsWith('branch'))
        if (branches.length > 0) {
            let letters = branches.map(key => key.slice(6)).sort()
            let lastKey = letters[letters.length - 1]
            nextBranch = lastKey.substring(0, lastKey.length - 1)
                + String.fromCharCode(lastKey.charCodeAt(lastKey.length - 1) + 1)
        } else {
            nextBranch = "A"
        }
    }
    if (props.depth === 2) {
        let subBranches = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch'))
        if (subBranches && subBranches.length > 0) {
            let letters = subBranches.map(key => key.slice(6)).sort()
            let lastKey = letters[letters.length - 1]
            let nextNumber = parseInt(lastKey.slice(1), 10) + 1
            let parentLetter = props.keyValue.slice(6)
            nextBranch = parentLetter + nextNumber
        } else {
            let parentLetter = props.keyValue.slice(6)
            nextBranch = parentLetter + 1
        }
    }
    if (props.depth === 3) {
        let subBranches = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch'))
        if (subBranches && subBranches.length > 0) {
            let letters = subBranches.map(key => key.slice(6)).sort()
            let lastKey = letters[letters.length - 1]
            let nextNumber = parseInt(lastKey.slice(1), 10) + 1
            let parentLetter = props.parentsParent.slice(6)
            nextBranch = parentLetter + nextNumber
        } else {
            let parentLetter = props.parentsParent.slice(6)
            let parentNumber = props.parent.slice(7)
            nextBranch = parentLetter + parentNumber + 1
        }
    }
    if (props.depth === 4) {
        let subBranches = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch'))
        if (subBranches && subBranches.length > 0) {
            let letters = subBranches.map(key => key.slice(6)).sort()
            let lastKey = letters[letters.length - 1]
            let nextNumber = parseInt(lastKey.slice(1), 10) + 1
            let parentLetter = props.parentsParentsParent.slice(6)
            nextBranch = parentLetter + nextNumber
        } else {
            let parentLetter = props.parentsParentsParent.slice(6)
            let parentNumber = props.parent.slice(7)
            nextBranch = parentLetter + parentNumber + 1
        }
    }

    const addBranch = () => {
        const newSurveyData = {...surveyData}
        if (props.depth === 1) {
            let branches = Object.keys(props.data).filter(key => key.startsWith('branch'))
            if (branches.length > 0) {
                let letters = branches.map(key => key.slice(6)).sort()
                let lastKey = letters[letters.length - 1]
                let nextKey = lastKey.substring(0, lastKey.length - 1)
                    + String.fromCharCode(lastKey.charCodeAt(lastKey.length - 1) + 1)
                newSurveyData.config["branch" + nextKey] = {
                    condition: "^[" + nextKey.toLowerCase() + nextKey.toUpperCase() + "]\\b",
                    message: ""
                }
            } else {
                newSurveyData.config["branchA"] = {
                    condition: "^[aA]\\b",
                    message: ""
                }
            }
        }
        if (props.depth === 2) {
            let subBranches = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch'))
            if (subBranches && subBranches.length > 0) {
                let letters = subBranches.map(key => key.slice(6)).sort()
                let lastKey = letters[letters.length - 1]
                let nextNumber = parseInt(lastKey.slice(1), 10) + 1
                let parentLetter = props.keyValue.slice(6)
                let nextKey = parentLetter + nextNumber
                let parentCondition = parentLetter.toLowerCase() + parentLetter.toUpperCase()
                newSurveyData.config[props.keyValue]["branch" + nextKey] = {
                    condition: "^[" + parentCondition + "]" + nextNumber + "\\b",
                    message: ""
                }
            } else {
                let parentLetter = props.keyValue.slice(6)
                let parentCondition = parentLetter.toLowerCase() + parentLetter.toUpperCase()
                newSurveyData.config[props.keyValue]["branch" + parentLetter +"1"] = {
                    condition: "^[" + parentCondition + "]1\\b",
                    message: ""
                }
            }
        }
        if (props.depth === 3) {
            let subBranches = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch'))
            if (subBranches && subBranches.length > 0) {
                let letters = subBranches.map(key => key.slice(6)).sort()
                let lastKey = letters[letters.length - 1]
                let nextNumber = parseInt(lastKey.slice(1), 10) + 1
                let parentLetter = props.parentsParent.slice(6)
                let nextKey = parentLetter + nextNumber
                let parentCondition = parentLetter.toLowerCase() + parentLetter.toUpperCase()
                newSurveyData.config[props.parentsParent][props.parent]["branch" + nextKey] = {
                    condition: "^[" + parentCondition + "]" + nextNumber + "\\b",
                    message: ""
                }
            } else {
                let parentLetter = props.parentsParent.slice(6)
                let parentCondition = parentLetter.toLowerCase() + parentLetter.toUpperCase()
                let parentNumber = props.parent.slice(7)
                newSurveyData.config[props.parentsParent][props.parent]["branch" + parentLetter + parentNumber +"1"] = {
                    condition: "^[" + parentCondition + "]" + parentNumber + "1\\b",
                    message: ""
                }
            }
        }
        if (props.depth === 4) {
            let subBranches = Object.keys(props.data[props.keyValue]).filter(key => key.startsWith('branch'))
            if (subBranches && subBranches.length > 0) {
                let letters = subBranches.map(key => key.slice(6)).sort()
                let lastKey = letters[letters.length - 1]
                let nextNumber = parseInt(lastKey.slice(1), 10) + 1
                let parentLetter = props.parentsParentsParent.slice(6)
                let nextKey = parentLetter + nextNumber
                let parentCondition = parentLetter.toLowerCase() + parentLetter.toUpperCase()
                newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent]["branch" + nextKey] = {
                    condition: "^[" + parentCondition + "]" + nextNumber + "\\b",
                    message: ""
                }
            } else {
                let parentLetter = props.parentsParentsParent.slice(6)
                let parentCondition = parentLetter.toLowerCase() + parentLetter.toUpperCase()
                let parentNumber = props.parent.slice(7)
                newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent]["branch" + parentLetter + parentNumber +"1"] = {
                    condition: "^[" + parentCondition + "]" + parentNumber + "1\\b",
                    message: ""
                }
            }
        }
        setSurveyData(newSurveyData)
    }

    const addReply = () => {
        const newSurveyData = {...surveyData}
        if (props.depth === 1) {
            newSurveyData.config["branchA"] = {
                condition: ".*",
                message: ""
            }
        }
        if (props.depth === 2) {
            let parentLetter = props.keyValue.slice(6)
            newSurveyData.config[props.keyValue]["branch" + parentLetter +"1"] = {
                condition: ".*",
                message: ""
            }
        }
        if (props.depth === 3) {
            let parentLetter = props.parentsParent.slice(6)
            let parentNumber = props.parent.slice(7)
            newSurveyData.config[props.parentsParent][props.parent]["branch" + parentLetter + parentNumber +"1"] = {
                condition: ".*",
                message: ""
            }
        }
        if (props.depth === 4) {
            let parentLetter = props.parentsParentsParent.slice(6)
            let parentNumber = props.parent.slice(7)
            newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent]["branch" + parentLetter + parentNumber +"1"] = {
                condition: ".*",
                message: ""
            }
        }
        setSurveyData(newSurveyData)
    }

    const addOther = () => {
        const newSurveyData = {...surveyData}
        if (props.depth === 1) {
            newSurveyData.config["other"] = {
                message: ""
            }
        }
        if (props.depth === 2) {
            newSurveyData.config[props.keyValue]["other"] = {
                message: ""
            }
        }
        if (props.depth === 3) {
            newSurveyData.config[props.parentsParent][props.parent]["other"] = {
                message: ""
            }
        }
        if (props.depth === 4) {
            newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent]["other"] = {
                message: ""
            }
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

    return <div className="message-toolbar">
        {!toolbarOpen &&
        <button className={"add-step"} onClick={() => setToolbarOpen(true)}>
            +
        </button>
        }
        {toolbarOpen &&
        <div className={"toolbar-option"}>
            {props.depth < 5 && !optionLimitFull &&
            <button className={"option"} onClick={() => {
                addBranch()
                !hasOtherOption && addOther()
            }}>
                <div className={"icon"} style={{backgroundColor: color}}>{nextBranch}</div>
                <div className={"text"}>{intl.formatMessage(
                    {
                        id: 'survey.message.option',
                        defaultMessage: 'Option',
                    })}</div>
            </button>
            }
            {!hasOtherOption &&
            <button className={"option"} onClick={() => addOther()}>
                <div className={"icon"}><ErrorIcon /></div>
                <div className={"text"}>{intl.formatMessage(
                    {
                        id: 'survey.message.other',
                        defaultMessage: 'Error message',
                    })}</div>
            </button>
            }
            {!hasOtherOption && !hasBranches &&
            <button className={"option"} onClick={() => addReply()}>
                <div className={"icon"}><ReplyIcon/></div>
                <div className={"text"}>{intl.formatMessage(
                    {
                        id: 'survey.message.reply',
                        defaultMessage: 'Reply',
                    })}</div>
            </button>
            }
            <div onClick={() => setToolbarOpen(false)}>
                {intl.formatMessage(
                    {
                        id: 'survey.message.close',
                        defaultMessage: 'Close',
                    })}
            </div>
        </div>
        }
    </div>
}