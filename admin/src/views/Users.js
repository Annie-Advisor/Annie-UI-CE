import {useIntl} from "react-intl";

export default function Users() {
    const intl = useIntl()

    return (
        <div className={"content"}>
            <h1>{intl.formatMessage(
                {
                    id: 'main.sidebar.users',
                    defaultMessage: 'Users',
                }
            )}</h1>
        </div>
    );
}