import {useIntl} from "react-intl";
import React, {useState} from "react";
import '../scss/SurveySupportNeeds.scss';
import {useCodesData, useSurveyData, useUserData, useUserSurveyData} from "./SurveyView";
import _ from "lodash"
import {getBranchIconColor, getMessageIcon, Popup, Toast} from "../UIElements";
import {getNameWithAnnieUser, setBranchCategory, setSupportNeedStatus} from "../DataFunctions";
import {ReactComponent as SupportIcon} from "../svg/support.svg";
import {ReactComponent as ProviderIcon} from "../svg/provider.svg";
import {ReactComponent as BranchesIcon} from "../svg/branches.svg";
import {PostCodes} from "../api/APISurvey";
import {ReactComponent as CloseIcon} from "../svg/close.svg";

export default function SurveySupportNeeds() {
    const {userSurveyData, setUserSurveyData} = useUserSurveyData()
    const {userData} = useUserData()
    const {surveyData} = useSurveyData()
    const {codesData} = useCodesData()
    const [showPopup, setShowPopup] = useState(false)
    const [copiedUsers, setCopiedUsers] = useState([])

    const intl = useIntl()
    const surveyCoordinators = userSurveyData.filter(user => user.meta.coordinator)
    let branchesWithSupportNeed = []
    supportNeedCheck(surveyData.config, null, 1, null, null, null)
    function supportNeedCheck(data, parentColor, depth, parent, parentsParent, parentsParentsParent) {
        for (const obj in data) {
            let props = {
                keyValue: obj,
            }
            if (data[obj].supportneed === true) {
                if (parentColor) {
                    props[parentColor] = parentColor
                }
                branchesWithSupportNeed.push({
                    "keyValue":obj,
                    "parent": parent,
                    "parentsParent": parentsParent,
                    "parentsParentsParent": parentsParentsParent,
                    "category":data[obj].category,
                    "title":data[obj].message,
                    "condition":data[obj].condition,
                    "color": getBranchIconColor(props, obj.startsWith('branch')),
                    "depth": depth
                    })
            }
            if (typeof data[obj] === 'object' && data[obj] !== null) {
                supportNeedCheck(data[obj], getBranchIconColor(props, true), depth+1, obj, parent, parentsParent)
            }
        }
    }
    let supportNeedCategoryGroups = _.groupBy(branchesWithSupportNeed, need => need.category)

    const setCoordinatorToSurvey = (user) => {
        const newUserSurveyData = [...userSurveyData]
        if (newUserSurveyData.some(obj => obj.annieuser === user.id)) {
            const userIndex = newUserSurveyData.findIndex(obj => obj.annieuser === user.id)
            newUserSurveyData[userIndex].meta.coordinator = true
        } else {
            newUserSurveyData.push({
                annieuser:user.id,
                survey:surveyData.id,
                meta:{
                    coordinator: true
                }
            })
        }
        setUserSurveyData(newUserSurveyData)
        setShowPopup(false)
    }

    const removeCoordinatorFromSurvey = (coordinator) => {
        const newUserSurveyData = [...userSurveyData]
        const userIndex = newUserSurveyData.findIndex(obj => obj.annieuser === coordinator.annieuser)
        delete newUserSurveyData[userIndex].meta.coordinator
        setUserSurveyData(newUserSurveyData)
    }

    return <>
        <div className={"support-needs-container"}>
            <h4>
                {intl.formatMessage(
                    {
                        id: 'survey.supportNeeds',
                        defaultMessage: 'Support Needs',
                    })}
            </h4>
            {branchesWithSupportNeed.length > 0 ?
                Object.keys(supportNeedCategoryGroups).map((group, i) => {
                    return <div className={"support-need-group"} key={i}>
                        <SupportNeedRender supportNeedCategoryGroups={supportNeedCategoryGroups} codesData={codesData} group={group} />
                        <SupportProviders userData={userData} group={group} setCopiedUsers={setCopiedUsers} copiedUsers={copiedUsers}/>
                        <SupportBranchGroup supportNeedCategoryGroups={supportNeedCategoryGroups} group={group}/>
                    </div>
                })
            :
                <p className={"placeholder"}>
                    {intl.formatMessage(
                        {
                            id: 'survey.supportNeeds.placeholder',
                            defaultMessage: 'Your messages don\'t create any support needs currently. Start by activating a lifesaver in the message tab.',
                        })}
                </p>
            }
            <div>
            </div>
        </div>
        <h4>
            {intl.formatMessage(
                {
                    id: 'survey.supportNeeds.coordinators',
                    defaultMessage: 'Survey Coordinators',
                })}
        </h4>
        <div className={"block-container survey-coordinators"}>
            {surveyCoordinators.length < 1 &&
            <p className={"placeholder"}>
                {intl.formatMessage(
                    {
                        id: 'survey.surveyCoordinator.placeholder',
                        defaultMessage: 'Your survey doesn\'t have a coordinator. The coordinator can see all support needs generated by this survey.',
                    })}
            </p>}
            {surveyCoordinators.map((user, i) => {
                return <div className={"block"} key={i}>
                    <span>{getNameWithAnnieUser(userData, user.annieuser)}</span>
                    <div className={"close-icon"} onClick={() => removeCoordinatorFromSurvey(user)}>
                        <CloseIcon/>
                    </div>
                </div>
            })}
        </div>
        <button className={"add-new-button"} onClick={() => {
            setShowPopup(true)
        }}>
            {intl.formatMessage(
                {
                    id: 'survey.supportNeeds.addCoordinator',
                    defaultMessage: '+ Add Coordinator',
                })}
        </button>
        {showPopup &&
        <Popup closePopup={() => setShowPopup(false)}>
            <h1>
                {intl.formatMessage({
                    id: 'survey.supportNeeds.addCoordinatorToSurvey',
                    defaultMessage: 'Add a Coordinator to this Survey',
                })}
            </h1>
            <p>
                {intl.formatMessage({
                    id: 'main.sidebar.supportProviders',
                    defaultMessage: 'Support Providers',
                })}
            </p>
            <div className={"block-container"}>
                {
                    userData.map((user, i) => {
                        const userIndex = userSurveyData.some(obj => obj.annieuser === user.id) && userSurveyData.findIndex(obj => obj.annieuser === user.id)
                        if ((userIndex || userIndex === 0) && userSurveyData[userIndex].meta.coordinator) {
                            return <div className={"block selected"} key={i}
                                        onClick={() => setShowPopup(false)}>
                                {
                                    user.meta && user.meta.firstname && user.meta.lastname ?
                                        user.meta.firstname + " " + user.meta.lastname :
                                        user.id
                                }
                            </div>
                        }
                        return <div className={"block outlined"} key={i} onClick={() => {
                            setCoordinatorToSurvey(user)
                        }}>
                            {
                                user.meta && user.meta.firstname && user.meta.lastname ?
                                    user.meta.firstname + " " + user.meta.lastname :
                                    user.id
                            }
                        </div>
                    })
                }
            </div>
        </Popup>
        }
        </>
}

function SupportBranchGroup({supportNeedCategoryGroups, group}) {
    const intl = useIntl()
    return <>
        <div className={"support-container"}>
            <div className={"icon"} title={intl.formatMessage(
                {
                    id: 'survey.supportNeeds.branch',
                    defaultMessage: 'Branches with Support Need',
                })}>
                <BranchesIcon/>
            </div>
            <div className={"needs-container"}>
                {supportNeedCategoryGroups[group].map((need, i) => {
                    return <SupportBranch need={need} key={i}/>
                })}
            </div>
        </div>
    </>
}

function SupportBranch({need}) {
    const [showPopup, setShowPopup] = useState(false)
    let isBranch = need.keyValue.startsWith('branch')

    return <>
        <div className={"message-icon"} title={need.title} style={{backgroundColor:need.color}} onClick={() => setShowPopup(true)}>
            {getMessageIcon(need, isBranch)}
        </div>
        {showPopup &&
        <Popup closePopup={() => setShowPopup(false)}>
            <SupportNeedSelector need={need} closePopup={() => setShowPopup(false)}/>
        </Popup>
        }
        </>
}

function SupportNeedRender({supportNeedCategoryGroups, codesData, group}) {
    const intl = useIntl()
    const [showPopup, setShowPopup] = useState(false)

    return <>
        <div className={"support-container"}>
            <div className={"icon"} title={intl.formatMessage(
                {
                    id: 'survey.supportNeeds.supportNeed',
                    defaultMessage: 'Support Need',
                })}>
                <SupportIcon/>
            </div>
        {codesData.hasOwnProperty(group) ?
            <div className={"block"} onClick={() => setShowPopup(true)}>
                {codesData[group][intl.locale]}
            </div> :
            <div className={"block not-assigned"} onClick={() => setShowPopup(true)}>
                {intl.formatMessage({
                    id: 'survey.assignSupportNeed',
                    defaultMessage: '+ Assign Support Need',
                })}
            </div>
        }
    </div>
        {showPopup &&
        <Popup closePopup={() => setShowPopup(false)}>
            <SupportNeedSelector group={group} isGroup={true} supportNeedCategoryGroups={supportNeedCategoryGroups} closePopup={() => setShowPopup(false)}/>
        </Popup>
        }
    </>
}

export function SupportNeedSelector({need, group, isGroup, closePopup, supportNeedCategoryGroups}) {
    const {surveyData, setSurveyData} = useSurveyData()
    const {codesData, setCodesData} = useCodesData()
    const [elementName, setElementName] = useState("")
    const intl = useIntl()
    const removeSupportNeed = () => {
        const newSurveyData = {...surveyData}
        setSupportNeedStatus(true, newSurveyData.config, need.depth, need.keyValue, need.parent, need.parentsParent, need.parentsParentsParent)
        setSurveyData(newSurveyData)
        closePopup()
    }

    const setSupportCategory = category => {
        const newSurveyData = {...surveyData}
        setBranchCategory(newSurveyData.config, need.depth, category, need.keyValue, need.parent, need.parentsParent, need.parentsParentsParent)
        setSurveyData(newSurveyData)
        closePopup()
    }

    const setSupportCategoryToGroup = (category, group) => {
        const newSurveyData = {...surveyData}
        supportNeedCategoryGroups[group].forEach(need => {
            setBranchCategory(newSurveyData.config, need.depth, category, need.keyValue, need.parent, need.parentsParent, need.parentsParentsParent)
        })
        setSurveyData(newSurveyData)
        closePopup()
    }

    function generateNewCode(code) {
        let codeArray = code.match(/[a-z]+|[^a-z]+/gi)
        let codeLetter = codeArray[0]
        let codeNumber = codeArray[1]
        let newNumber = codeNumber ? Number(codeNumber)+1 : 1
        let newCode = codeLetter+newNumber
        return codesData.hasOwnProperty(newCode) ? generateNewCode(newCode) : newCode
    }

    const createNewCode = e => {
        e.preventDefault()
        let code, newCode
        code = isGroup ? group[0] : need.keyValue.slice(6)
        const codeExists = codesData.hasOwnProperty(code)
        if (codeExists) {
            newCode = generateNewCode(code)
        } else {
            newCode = code
        }
        const newCodesData = {...codesData}
        newCodesData[newCode] = {
            en: elementName,
            fi: elementName
        }
        setCodesData(newCodesData)
        const codeToPost = [{codeset: "category", code: newCode, value: newCodesData[newCode]}]
        saveCode(codeToPost)
        isGroup ? setSupportCategoryToGroup(newCode, group) : setSupportCategory(newCode)
    }

    const codePostAPI = PostCodes()

    const saveCode = (codeToPost) => {
        codePostAPI.mutate(codeToPost, {
            onError: error => {
                console.log(error)
            },
            onSuccess:() => {
                console.log("Posted: "+codeToPost)
            }
        })
    }

    if (isGroup) {
        return <>
            <h1>
                {supportNeedCategoryGroups[group].length > 1 ?
                    intl.formatMessage({
                        id: 'survey.assignNeedForAnswers',
                        defaultMessage: 'Choose Support Need for Answers',
                    }) :
                    intl.formatMessage({
                        id: 'survey.assignNeedForAnswer',
                        defaultMessage: 'Choose Support Need for Answer',
                    })
                }
                {supportNeedCategoryGroups[group].map((need,i) => {
                    if (i === 0) {
                        return <b key={i}> {need.keyValue.slice(6)}</b>
                    }
                    if (i+1 === supportNeedCategoryGroups[group].length) {
                        return <React.Fragment key={i}> & <b>{need.keyValue.slice(6)}</b></React.Fragment>
                    }
                    return <React.Fragment key={i}>, <b>{need.keyValue.slice(6)}</b></React.Fragment>
                })}
            </h1>
            <p>
                {intl.formatMessage({
                    id: 'survey.supportNeeds',
                    defaultMessage: 'Support Needs',
                })}
            </p>
            <div className={"block-container"}>
                {Object.keys(codesData).map((key, i) => {
                    return <div className={codesData.hasOwnProperty(group) && group === key ? "block selected" : "block outlined"}
                                key={i} onClick={() => setSupportCategoryToGroup(key, group)}>
                        {codesData[key][intl.locale]}
                    </div>
                })}
            </div>
            <div className={"new-support-need-container"}>
                <p>
                    {intl.formatMessage({
                        id: 'survey.supportNeeds.createSupportNeed',
                        defaultMessage: 'Create New Support Need',
                    })}
                    <span role="img" className={"not-found"} aria-label="not-found-yet" title={"This does not send data to database yet"}>🤷</span>
                </p>
                <form className={"new-support-need"} onSubmit={e => createNewCode(e)}>
                    <input type={"text"} className={"add-element"} value={elementName}
                           onChange={e => setElementName(e.target.value)}
                           placeholder={intl.formatMessage(
                               {
                                   id: 'survey.supportNeeds.newSupportNeedPlaceholder',
                                   defaultMessage: 'Give your support need a descriptive name',
                               })}
                    />
                    <button className={"commit"} type={"submit"}>+</button>
                </form>
            </div>
        </>
    }

    return <>
        <h1>
            {intl.formatMessage({
                id: 'survey.assignNeedForAnswer',
                defaultMessage: 'Choose Support Need for Answer',
            })}
            <b> {need.keyValue.slice(6)}</b>
        </h1>
        <p>
            {intl.formatMessage({
                id: 'survey.supportNeeds',
                defaultMessage: 'Support Needs',
            })}
        </p>
        <div className={"block-container"}>
            {Object.keys(codesData).map((key, i) => {
                return <div className={codesData.hasOwnProperty(need.category) && need.category === key ? "block selected" : "block outlined"}
                            key={i} onClick={() => setSupportCategory(key)}>
                    {codesData[key][intl.locale]}
                </div>
            })}
        </div>
        <div className={"new-support-need-container"}>
            <p>
                {intl.formatMessage({
                    id: 'survey.supportNeeds.createSupportNeed',
                    defaultMessage: 'Create New Support Need',
                })}
                <span role="img" className={"not-found"} aria-label="not-found-yet" title={"This does not send data to database yet"}>🤷</span>
            </p>
            <form className={"new-support-need"} onSubmit={e => createNewCode(e)}>
                <input type={"text"} className={"add-element"} value={elementName}
                       onChange={e => setElementName(e.target.value)}
                       placeholder={intl.formatMessage(
                           {
                               id: 'survey.supportNeeds.newSupportNeedPlaceholder',
                               defaultMessage: 'Give your support need a descriptive name',
                           })}
                />
                <button className={"commit"} type={"submit"}>+</button>
            </form>
        </div>
        <div className={"remove-element"}>
            <p>
                <span className={"red"} onClick={()=>removeSupportNeed()}>{intl.formatMessage({
                    id: 'survey.remove',
                    defaultMessage: 'Remove',
                })}</span>
                {intl.formatMessage({
                    id: 'survey.remove.supportNeed',
                    defaultMessage: ' Support Need from Answer',
                })} {need.keyValue.slice(6)}
            </p>
        </div>
    </>
}

function SupportProviders({userData, group, setCopiedUsers, copiedUsers}) {
    const {userSurveyData, setUserSurveyData} = useUserSurveyData()
    const [tempUserSurveyData, setTempUserSurveyData] = useState([])
    const {codesData} = useCodesData()
    const {surveyData} = useSurveyData()
    const intl = useIntl()
    const [showPopup, setShowPopup] = useState(false)
    const [searchText, setSearchText] = useState("")
    let filterUserData = userData.filter(isIdOrName)
    const [showToast, setShowToast] = useState(false)
    const [toastText, setToastText] = useState("")

    function isIdOrName(user) {
        if (user.hasOwnProperty("id") && user.id.toLowerCase().includes(searchText.toLowerCase())){
            return true
        }
        if (user.hasOwnProperty("meta") && user.meta) {
            if (user.meta.hasOwnProperty("firstname")) {
                if (user.meta.firstname.toLowerCase().includes(searchText.toLowerCase())) {
                    return true
                }
            }
            if (user.meta.hasOwnProperty("lastname")) {
                if (user.meta.lastname.toLowerCase().includes(searchText.toLowerCase())) {
                    return true
                }
            }
        }
        return false
    }

    const setSupportProviderToCategory = user => {
        const newUserSurveyData = [...tempUserSurveyData]
        if (newUserSurveyData.some(obj => obj.annieuser === user.id)) {
            const userIndex = newUserSurveyData.findIndex(obj => obj.annieuser === user.id)
            if (newUserSurveyData[userIndex].meta.hasOwnProperty("category")) {
                newUserSurveyData[userIndex].meta.category[group] = true
            } else {
                newUserSurveyData[userIndex].meta = {
                    coordinator: true,
                    category: {
                        [group]:true
                    }
                }
            }
        } else {
            newUserSurveyData.push({
                annieuser:user.id,
                survey:surveyData.id,
                meta:{
                    category:{
                        [group]:true
                    }
                }
            })
        }
        setTempUserSurveyData(newUserSurveyData)
    }

    const removeSupportProviderFromTemp = user => {
        const newUserSurveyData = [...tempUserSurveyData]
        const userIndex = newUserSurveyData.findIndex(obj => obj.annieuser === user.id)
        delete newUserSurveyData[userIndex].meta.category[group]
        setTempUserSurveyData(newUserSurveyData)
    }

    const removeProviderFromSurvey = user => {
        const newUserSurveyData = [...userSurveyData]
        const userIndex = newUserSurveyData.findIndex(obj => obj.annieuser === user.annieuser)
        delete newUserSurveyData[userIndex].meta.category[group]
        setUserSurveyData(newUserSurveyData)
    }

    const cancelProviderEdits = () => {
        setShowPopup(false)
        setTempUserSurveyData([])
    }

    const confirmProviderEdits = () => {
        setUserSurveyData([...tempUserSurveyData])
        setShowPopup(false)
        setTempUserSurveyData([])
    }

    const setUsersToCopy = () => {
        const copyUsers = tempUserSurveyData.filter(user => user.meta && user.meta.category &&user.meta.category[group])
        setCopiedUsers(copyUsers)
        setToastText(intl.formatMessage(
            {
                id: 'survey.supportProvider.providersCopied',
                defaultMessage: 'Support Providers Copied!',
            }))
        setShowToast(true)
    }

    const pasteUsersToSupportNeed = () => {
        const newUserSurveyData = [...tempUserSurveyData]
        copiedUsers.forEach(user => {
            if (newUserSurveyData.some(obj => obj.annieuser === user.annieuser)) {
                const userIndex = newUserSurveyData.findIndex(obj => obj.annieuser === user.annieuser)
                if (newUserSurveyData[userIndex].meta.hasOwnProperty("category")) {
                    newUserSurveyData[userIndex].meta.category[group] = true
                } else {
                    newUserSurveyData[userIndex].meta = {
                        coordinator: true,
                        category: {
                            [group]:true
                        }
                    }
                }
            } else {
                newUserSurveyData.push({
                    annieuser:user.annieuser,
                    survey:surveyData.id,
                    meta:{
                        category:{
                            [group]:true
                        }
                    }
                })
            }
        })
        setTempUserSurveyData(newUserSurveyData)
        setToastText(intl.formatMessage(
            {
                id: 'survey.supportProvider.providersPasted',
                defaultMessage: 'Support Providers Pasted!',
            }))
        setShowToast(true)
    }

    return <>
        <div className={"support-container"}>
            <div className={"icon"} title={intl.formatMessage(
                {
                    id: 'survey.supportNeeds.supportProvider',
                    defaultMessage: 'Support Provider',
                })}>
                <ProviderIcon/>
            </div>
            <div className={"support-providers-container"}>
                {userSurveyData.map((user, i) => {
                    if (user.meta && user.meta.hasOwnProperty("category") && user.meta.category.hasOwnProperty(group)) {
                        return <div className={"support-provider block"} key={i}>
                            <span>{getNameWithAnnieUser(userData, user.annieuser)}</span>
                            <div className={"close-icon"} onClick={() => removeProviderFromSurvey(user)}>
                                <CloseIcon/>
                            </div>
                        </div>
                    }
                    return false
                })}
                <button className="support-provider block not-assigned add-provider" onClick={() => {
                    setTempUserSurveyData(_.cloneDeep(userSurveyData))
                    setShowPopup(true)
                }}>
                    {userSurveyData.filter(user => user.meta && user.meta.hasOwnProperty("category") && user.meta.category.hasOwnProperty(group)).length < 1 ?
                        intl.formatMessage(
                        {
                            id: 'survey.supportNeeds.addSupportProvider',
                            defaultMessage: '+ Add Support Provider',
                        }) :
                        intl.formatMessage(
                            {
                                id: 'survey.supportNeeds.editSupportProviders',
                                defaultMessage: 'Edit Support Providers',
                            })
                    }
                </button>
            </div>
        </div>
        {showPopup &&
        <Popup closePopup={() => cancelProviderEdits()}>
            <h1>
                {intl.formatMessage({
                    id: 'survey.selectSupportProvidersForSupportNeed',
                    defaultMessage: 'Select Support Providers for Support Need',
                })}
                <b> {codesData[group] ? codesData[group][intl.locale] : group}</b>
            </h1>
            <p>
                {intl.formatMessage({
                    id: 'main.sidebar.supportProviders',
                    defaultMessage: 'Support Providers',
                })}
            </p>
            <input type={"text"} className={"search"} value={searchText}
                   onChange={e => {
                       setSearchText(e.target.value)
                   }}
                   placeholder={intl.formatMessage(
                       {
                           id: 'supportProviders.search.placeholder',
                           defaultMessage: 'Search for Support Provider',
                       })}/>
            <div className={"block-container"}>
                {
                    filterUserData.map((user, i) => {
                        const userIndex = tempUserSurveyData.some(obj => obj.annieuser === user.id) && tempUserSurveyData.findIndex(obj => obj.annieuser === user.id)
                        if ((userIndex || userIndex === 0) && tempUserSurveyData[userIndex].meta.hasOwnProperty("category") && tempUserSurveyData[userIndex].meta.category[group]) {
                            return <div className={"block outlined support-provider selected"} key={i}
                                        onClick={() => removeSupportProviderFromTemp(user)}>
                                {
                                    user.meta && user.meta.firstname && user.meta.lastname ?
                                        user.meta.firstname + " " + user.meta.lastname :
                                        user.id
                                }
                            </div>
                        }
                        return <div className={"block outlined"} key={i}
                                    onClick={() => setSupportProviderToCategory(user)}>
                            {
                                user.meta && user.meta.firstname && user.meta.lastname ?
                                    user.meta.firstname + " " + user.meta.lastname :
                                    user.id
                            }
                        </div>
                    })
                }
            </div>
            {filterUserData.length < 1 &&
            <p className={"placeholder"}>
                {intl.formatMessage(
                    {
                        id: 'supportProviders.nonFound.placeholder',
                        defaultMessage: 'Sorry! No support providers found.',
                    })}
            </p>
            }
            <div className={"modal-options"}>
                <button className={"text"} onClick={()=>setUsersToCopy()}>
                    {intl.formatMessage(
                        {
                            id: 'copy',
                            defaultMessage: 'Copy',
                        })}
                </button>
                {copiedUsers.length > 0 &&
                <button className={"text"} onClick={()=>pasteUsersToSupportNeed()}>
                    {intl.formatMessage(
                        {
                            id: 'paste',
                            defaultMessage: 'Paste',
                        })}
                </button>
                }
                <button className={"cancel"} onClick={()=>cancelProviderEdits()}>
                    {intl.formatMessage(
                        {
                            id: 'modal.cancel',
                            defaultMessage: 'Cancel',
                        })}
                </button>
                <button onClick={()=>confirmProviderEdits()} className={"confirm"}>
                    {intl.formatMessage(
                        {
                            id: 'select',
                            defaultMessage: 'Select',
                        })}
                </button>
            </div>
        </Popup>
        }
        <Toast show={showToast} text={toastText} status={"success"} hideToast={()=>setShowToast(false)}/>
    </>
}