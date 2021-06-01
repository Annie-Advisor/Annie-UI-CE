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
import {getBranchIconColor, getMessageIcon, Modal, Popover} from "../UIElements";
import {useSurveyData} from "./SurveyView";

export default function SurveyMessages() {
    const {surveyData} = useSurveyData()
    const [messageContentOpen, setMessageContentOpen] = useState(true)
    const [showJson, setShowJson] = useState(false)
    const [jsonCopied, setJsonCopied] = useState(false)
    {jsonCopied &&
        setTimeout(() => {setJsonCopied(false)},3000)
    }
    // TODO: Remove all temp-admin stuff

    return <>
        <div className={"messages"}>
            {messageContentOpen ? <>
                <div className={"message-container has-steps"}>
                    <div className={"message"}>
                        <div className={"message-icon"} onClick={() => setMessageContentOpen(!messageContentOpen)}>
                            <MessageIcon />
                        </div>
                        <div className={"message-content"}>
                            <EditableContent text={surveyData.config.message} data={surveyData.config} keyValue={"message"}
                                             depth={0}/>
                        </div>
                    </div>
                    <div className={"message-children"}>
                        <GetMessages data={surveyData.config} depth={1}/>
                    </div>
                    <MessageToolbar data={surveyData.config} depth={1}/>
                </div>
                </> :
                <div className={"message"}>
                    <div className={"message-icon"} onClick={() => setMessageContentOpen(!messageContentOpen)}>Q</div>
                    <div className={"show-message"} onClick={() => setMessageContentOpen(true)}>
                        <ShowExtraIcon />
                    </div>
                </div>
            }
        </div>
        <div className={"temp-admin"}>
            <h3>Temporary admin stuff v.1.03</h3>
            <button onClick={()=> {
                navigator.clipboard.writeText(JSON.stringify(surveyData))
                    setJsonCopied(true)
            }}>Copy JSON</button>
            <button onClick={()=>setShowJson(!showJson)}>{showJson ? "Hide JSON" : "Show JSON"}</button>
            {jsonCopied &&
            <p>JSON copied!</p>}
            {showJson &&
            <div className={"json"}><code>{JSON.stringify(surveyData, null, 2)}</code></div>
            }
        </div>
    </>
}

function GetMessages(props) {
    return <>
        {Object.keys(props.data).filter(key => key.startsWith('branch') || key === 'other')
            .map( (keyValue, i) => {
                return <Message data={props.data} parentColor={props.parentColor} keyValue={keyValue} i={i} key={i} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
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
                    <EditableContent text={props.data[props.keyValue].message} data={props.data} keyValue={props.keyValue} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
                    <OptionsPopUp data={props.data} keyValue={props.keyValue} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
                </div>
                {isBranch &&
                    <SupportNeedTools data={props.data} keyValue={props.keyValue} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
                }
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
    let hasSupportNeed
    let hasSupportNeedKey =  props.data[props.keyValue].hasOwnProperty('supportneed')
    if (hasSupportNeedKey) {
        hasSupportNeed = props.data[props.keyValue]["supportneed"]
    } else {
        hasSupportNeed = false
    }

    const toggleSupportNeed = () => {
        const newSurveyData = {...surveyData}
        if (hasSupportNeed) {
            if (props.depth === 1) {
                delete newSurveyData.config[props.keyValue]["supportneed"]
                delete newSurveyData.config[props.keyValue]["category"]
            }
            if (props.depth === 2) {
                delete newSurveyData.config[props.parent][props.keyValue]["supportneed"]
                delete newSurveyData.config[props.parent][props.keyValue]["category"]
            }
            if (props.depth === 3) {
                delete newSurveyData.config[props.parentsParent][props.parent][props.keyValue]["supportneed"]
                delete newSurveyData.config[props.parentsParent][props.parent][props.keyValue]["category"]
            }
            if (props.depth === 4) {
                delete newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent][props.keyValue]["supportneed"]
                delete newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent][props.keyValue]["category"]
            }
        } else {
            if (props.depth === 1) {
                newSurveyData.config[props.keyValue]["supportneed"] = true
                newSurveyData.config[props.keyValue]["category"] = props.keyValue.slice(6)
            }
            if (props.depth === 2) {
                newSurveyData.config[props.parent][props.keyValue]["supportneed"] = true
                newSurveyData.config[props.parent][props.keyValue]["category"] = props.keyValue.slice(6)
            }
            if (props.depth === 3) {
                newSurveyData.config[props.parentsParent][props.parent][props.keyValue]["supportneed"] = true
                newSurveyData.config[props.parentsParent][props.parent][props.keyValue]["category"] = props.keyValue.slice(6)
            }
            if (props.depth === 4) {
                newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent][props.keyValue]["supportneed"] = true
                newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent][props.keyValue]["category"] = props.keyValue.slice(6)
            }
        }
        setSurveyData(newSurveyData)
    }
    return <div className={"support-need-tools"}>
        <SupportIcon/>
        <input type={"checkbox"} onChange={toggleSupportNeed} className={"switch"} id={props.keyValue} defaultChecked={hasSupportNeed}
               />
        <label htmlFor={props.keyValue} className={"switch-label"} />
    </div>
}

function EditableContent(props) {
    // TODO: check if code can be refactored, so that the nested level of the edited object is not done manually
    const [editorState, setEditorState] = useState(
        () => EditorState.createWithContent(ContentState.createFromText(props.text)),
    )
    const {surveyData, setSurveyData} = useSurveyData()
    const intl = useIntl()
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
    return <Editor editorState={editorState} onChange={editorUpdate} placeholder={intl.formatMessage(
        {
            id: 'survey.message.placeholder',
            defaultMessage: 'Click to type your message',
        })} />
}

function  OptionsPopUp(props) {
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)
    const intl = useIntl()
    const {surveyData, setSurveyData} = useSurveyData()
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

    return <div className={"options-popover popover-container"}>
        <div className={"popover-toggle"} onClick={() => setPopoverOpen(true)}>
            <OptionsIcon />
        </div>
        {popoverOpen &&
            <Popover closePopover={() => setPopoverOpen(false)}>
                <div className={"delete"} onClick={() => {
                    setConfirmModalOpen(true)
                    setPopoverOpen(false)
                }}>
                    <DeleteIcon />
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
                    defaultMessage:  "Are you sure you want to delete this step?",
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
            }} confirmAction={() => deleteMessage()} />
        }
    </div>
}

function MessageToolbar(props) {
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
    if (props.depth > 2) {
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
                    condition: "^[" + nextKey.toLowerCase() + nextKey.toUpperCase() + "]$",
                    message: ""
                }
            } else {
                newSurveyData.config["branchA"] = {
                    condition: "^[aA]$",
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
                    condition: "^[" + parentCondition + "]" + nextNumber + "$",
                    message: ""
                }
            } else {
                let parentLetter = props.keyValue.slice(6)
                let parentCondition = parentLetter.toLowerCase() + parentLetter.toUpperCase()
                newSurveyData.config[props.keyValue]["branch" + parentLetter +"1"] = {
                    condition: "^[" + parentCondition + "]1$",
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
                    condition: "^[" + parentCondition + "]" + nextNumber + "$",
                    message: ""
                }
            } else {
                let parentLetter = props.parentsParent.slice(6)
                let parentCondition = parentLetter.toLowerCase() + parentLetter.toUpperCase()
                let parentNumber = props.parent.slice(7)
                newSurveyData.config[props.parentsParent][props.parent]["branch" + parentLetter + parentNumber +"1"] = {
                    condition: "^[" + parentCondition + "]" + parentNumber + "1$",
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
                    condition: "^[" + parentCondition + "]" + nextNumber + "$",
                    message: ""
                }
            } else {
                let parentLetter = props.parentsParentsParent.slice(6)
                let parentCondition = parentLetter.toLowerCase() + parentLetter.toUpperCase()
                let parentNumber = props.parent.slice(7)
                newSurveyData.config[props.parentsParentsParent][props.parentsParent][props.parent]["branch" + parentLetter + parentNumber +"1"] = {
                    condition: "^[" + parentCondition + "]" + parentNumber + "1$",
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
            <button className={"option"} onClick={() => addBranch()}>
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