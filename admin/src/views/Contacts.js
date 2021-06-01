import {useIntl} from "react-intl";

export default function Contacts() {
    const intl = useIntl()

    return (
        <div className={"content"}>
            <h1>{intl.formatMessage(
                {
                    id: 'main.sidebar.contacts',
                    defaultMessage: 'Contacts',
                }
            )}</h1>
        </div>
    );
}