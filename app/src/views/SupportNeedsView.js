import {RequestStatus, Skeleton} from "../UIElements";
import '../scss/SupportNeedsView.scss';
import {Link} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {GetCodes, GetContacts, GetSupportNeeds} from "../API";
import {formatDate, GetDifferenceText, getStudentFromContacts} from "../formats";
import {FormattedMessage, useIntl} from "react-intl";
import {ReactComponent as Acorn} from "../svg/acorn.svg";
import {ReactComponent as Face} from "../svg/face.svg";

export function SupportNeedsView() {
    const getSupportNeeds = GetSupportNeeds()
    const getContacts = GetContacts()
    const getCodes = GetCodes()
    const loading = getSupportNeeds.status === "loading" || getContacts.status === "loading" || getCodes.status === "loading"
    const error = getSupportNeeds.status === "error" || getContacts.status === "error" || getCodes.status === "error"
    const success = getSupportNeeds.status === "success" && getContacts.status === "success" && getCodes.status === "success"
    const intl = useIntl()

    return <>
        <main className={"support-requests-wrapper"}>
            {loading &&
                <SupportRequestsSkeleton />
            }
            {error &&
                <>
                    {
                        getSupportNeeds.status === "error" ?
                        <p>
                            {intl.formatMessage({
                            id: 'error.supportRequests',
                            defaultMessage: 'Error in loading support requests',
                        })}
                        </p> :
                        <p>
                            {intl.formatMessage({
                            id: 'error.contacts',
                            defaultMessage: 'Error in loading contacts',
                        })}
                        </p>
                    }
                </>
            }
            {success &&
                <SupportRequests data={getSupportNeeds.data} contacts={getContacts.data} codes={getCodes.data[0]}/>
            }
        </main>
    </>
}

function SupportRequests({data, contacts, codes}) {
    const intl = useIntl()
    const noSupportRequests = data.length < 1
    const [searchValue, setSearchValue] = useState(sessionStorage.getItem("searchValue") ? sessionStorage.getItem("searchValue") : "")
    const dataWithStatus100 = data.filter(e => e.status === "100" || e.status === "-1")
    const dataWithStatus1or2 = data.filter(e => e.status === "1" || e.status === "2")
    const data100SortedByUpdated = dataWithStatus100.sort((a,b) => new Date(formatDate(b.updated)) - new Date(formatDate(a.updated)))
    const dataOtherSortedByUpdated = dataWithStatus1or2.sort((a,b) => new Date(formatDate(b.updated)) - new Date(formatDate(a.updated)))
    const sortedData = dataOtherSortedByUpdated.concat(data100SortedByUpdated)
    sortedData.forEach(request => {
        request.student = getStudentFromContacts(request.contact, contacts)
        request.studentName = request.student.contact.firstname + " " + request.student.contact.lastname
        request.categoryName = codes.hasOwnProperty(request.category) ? codes[request.category][intl.locale] : null
    })
    const searchData = sortedData.filter(request => request.studentName.toLowerCase().includes(searchValue.toLowerCase())
        || (request.hasOwnProperty("categoryName") && request.categoryName && request.categoryName.toLowerCase().includes(searchValue.toLowerCase()))
        || (request.hasOwnProperty("student") && request.student.hasOwnProperty("contact") && request.student.contact.hasOwnProperty("degree") && request.student.contact.degree && request.student.contact.degree.toLowerCase().includes(searchValue.toLowerCase()))
        || (request.hasOwnProperty("student") && request.student.hasOwnProperty("contact") && request.student.contact.hasOwnProperty("group") && request.student.contact.group && request.student.contact.group.toLowerCase().includes(searchValue.toLowerCase()))
        || (request.hasOwnProperty("student") && request.student.hasOwnProperty("contact") && request.student.contact.hasOwnProperty("location") && request.student.contact.location && request.student.contact.location.toLowerCase().includes(searchValue.toLowerCase()))
        || (request.hasOwnProperty("student") && request.student.hasOwnProperty("contact") && request.student.contact.hasOwnProperty("phonenumber") && request.student.contact.phonenumber && request.student.contact.phonenumber.toLowerCase().includes(searchValue.toLowerCase()))
    )
    const [noOpenRequests, setNoOpenRequests] = useState(dataWithStatus1or2.length < 1)

    useEffect(() => {
        if (dataWithStatus1or2.length < 1) {
            document.title = intl.formatMessage({
                    id:"requests",
                    defaultMessage:"Requests | Annie Advisor",
                }, {
                    n: dataWithStatus1or2.length
                }
            )
            setNoOpenRequests(true)
        } else {
            document.title = intl.formatMessage({
                    id:"NRequests",
                    defaultMessage:"({n}) Requests | Annie Advisor",
                }, {
                    n: dataWithStatus1or2.length
                }
            )
            setNoOpenRequests(false)
        }

    }, [dataWithStatus1or2, intl])

    const setScrollPositionToSessionStorage = () => {
        sessionStorage.setItem("scrollPosition", window.pageYOffset.toString())
    }

    return <div className={"support-requests-container"}>
        {noOpenRequests && !noSupportRequests &&
        <div className={"no-requests-container"}>
            <div id={"no-open"}>
               <Acorn />
            </div>
            <h4>
                <FormattedMessage
                    id={"noOpenRequests"}
                    defaultMessage={"No open support requests!{br}All done for now."}
                    values={{br: <br/>}}/>
            </h4>
        </div>
        }
        {!noSupportRequests &&
            <>
                <input type={"search"} value={searchValue} autoFocus={sessionStorage.getItem("searchValue")}
                       onChange={e => {
                           setSearchValue(e.target.value)
                           sessionStorage.setItem("searchValue", e.target.value)
                       }}
                       placeholder={
                           intl.formatMessage({
                               id: 'search',
                               defaultMessage: 'Search',
                           })
                       } />
                <div className={"support-requests"}>
                    {searchData.length < 1 && searchValue.length > 0 &&
                    <h2>
                        {intl.formatMessage({
                            id: 'noSearchResults',
                            defaultMessage: 'No search results',
                        })}
                    </h2>
                    }
                    {searchData.map((request, i) => {
                        const deactive = request.status === "100" || request.status === "-1"
                        const category = request.categoryName ? request.categoryName : intl.formatMessage({
                            id: 'missingNameForCategory',
                            defaultMessage: 'Name missing for support category',
                        })
                        const requestId = request.id
                        const requestIdString = requestId.toString()

                        return <Link to={"request/"+requestIdString} state={{navigated:true}} onClick={()=>setScrollPositionToSessionStorage()} key={i} className={deactive ? "support-request deactive" : "support-request"}>
                            <div>
                                <RequestStatus status={request.status}/>
                                <h2>{request.studentName}</h2>
                                <h3>{category}</h3>
                            </div>
                            <RequestUpdated request={request} />
                        </Link>
                    })}
                </div>
            </>
        }
        {noSupportRequests &&
        <div className={"no-requests-container"}>
            <div id={"no-requests"}>
                <Face />
            </div>
            <h4>
                <FormattedMessage
                    id={"noRequests"}
                    defaultMessage={"You don't have any support requests right now.{br}We'll send an email when a request arrives."}
                    values={{br: <br/>}}/>
            </h4>
        </div>
        }
    </div>
}

export function RequestUpdated({request}) {
    const intl = useIntl()
    const updated = new Date(formatDate(request.updated)).toLocaleString(intl.locale)
    const dateDifference = new Date() - new Date(formatDate(request.updated))
    const differenceText = GetDifferenceText(dateDifference)

    return <div className={"updated"}>
        <p>{differenceText}</p>
        <p>{updated}</p>
    </div>
}

function SupportRequestsSkeleton() {
    const intl = useIntl()
    return <div className={"support-requests-container"}>
        <input type={"search"} disabled
               placeholder={intl.formatMessage({
                   id: 'loading',
                   defaultMessage: 'Loading',
               })+"..."} />
        <div className={"support-requests"}>
            {
                [...Array(9)].map( (e, i) => {
                    return <div className={"support-request"} key={i}>
                        <div>
                            <Skeleton height={20} width={70} marginBottom={12}/>
                            <Skeleton height={25} width={200} marginBottom={10}/>
                            <Skeleton height={17} width={150}/>
                        </div>
                        <div className={"updated"}>
                            <Skeleton height={35} width={100}/>
                        </div>
                    </div>
                })
            }
        </div>
    </div>
}