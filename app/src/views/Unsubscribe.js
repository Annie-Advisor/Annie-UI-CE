import '../scss/Unsubscribe.scss';
import React, {useState} from "react";
import {PostSendEmail, PostUnsubscribe} from "../API";
import {useCurrentUserData} from "../App";
import {ReactComponent as Leaf} from "../svg/leaf.svg";
import {ReactComponent as BackArrow} from "../svg/back-arrow.svg";
import {Link} from "react-router-dom";
import {FormattedMessage, useIntl} from "react-intl";

export default function Unsubscribe() {
    const intl = useIntl()
    const {currentUserData} = useCurrentUserData()
    const [unsubscribeText, setUnsubscribeText] = useState("")
    const [showSuccessScreen, setShowSuccessScreen] = useState(false)
    const postUnsubscribe = PostUnsubscribe()
    const postSendEmail = PostSendEmail()

    const currentUserInfo = currentUserData.hasOwnProperty("meta") ?
        "<table><tbody>"+
            Object.keys(currentUserData.meta).map((key, i) => ("<tr><th>"+key+"</th><td>"+currentUserData.meta[key]+"</td></tr>")).join('')
        +"</tbody></table>"
        : ""

    const unsubscribeAndSendEmail = () => {
        const emailData = {
            "subject": currentUserData.id + " unsubscribed from email notifications",
            "body": "<h1>"+currentUserData.id+" unsubscribed from email notifications.</h1>"+
                "<p><b>Reason:</b></p>"+
                "<p><em>"+unsubscribeText+"</em></p>"+
                currentUserInfo
        }
        const unsubscribeData = {"notifications":"DISABLED"}
        postUnsubscribe.mutate(unsubscribeData, {
            onError: error => {
                console.log(error)
            },
            onSuccess: () => {
                console.log("Unsubscribed from emails.")
                postSendEmail.mutate(emailData, {
                    onError: error => {
                        console.log(error)
                    },
                    onSuccess: () => {
                        setShowSuccessScreen(true)
                    }
                })
            }
        })
    }

    return <div className={"unsubscribe"}>
        {!showSuccessScreen ?
            <>
                <h1>{intl.formatMessage({
                    id: 'unsubscribeHeader',
                    defaultMessage: 'Unsubscribe from email notifications',
                })}</h1>
                <textarea value={unsubscribeText} disabled={postSendEmail.isLoading}
                          placeholder={intl.formatMessage({
                                  id: 'unsubscribePlaceholder',
                                  defaultMessage: 'Please describe the reason for unsubscribing from email notifications.',
                              })}
                          onChange={e=>setUnsubscribeText(e.target.value)}/>
                {unsubscribeText.length < 1 ?
                    <button disabled className={"main primary"}>
                        {intl.formatMessage({
                            id: 'unsubscribe',
                            defaultMessage: 'Unsubscribe',
                        })}
                    </button> :
                    postSendEmail.isLoading ?
                        <button disabled className={"main primary"}>
                            {intl.formatMessage({
                                id: 'unsubscribeLoading',
                                defaultMessage: 'Unsubscribing...',
                            })}
                        </button> :
                    <button className={"main primary"} onClick={()=>unsubscribeAndSendEmail()}>
                        {intl.formatMessage({
                            id: 'unsubscribe',
                            defaultMessage: 'Unsubscribe',
                        })}
                    </button>
                }
            </> :
            <>
                <div className={"image"}><Leaf /></div>
                <h1>
                    <FormattedMessage
                        id={"unsubscribeThanks"}
                        defaultMessage={"Thank you for the info.{br}You are now unsubscribed from email notifications."}
                        values={{br: <br/>}}/>
                </h1>
                <Link to={"/"} state={{navigated:true}} className={"button no-background"}><BackArrow />
                    {intl.formatMessage({
                        id: 'allSupportRequests',
                        defaultMessage: 'All support requests',
                    })}
                </Link>
            </>

        }
    </div>
}