import React, {useContext, useState} from 'react'
import "./scss/LocaleSwitcher.scss"
import {IntlProvider} from "react-intl"
import locale_en from "./lang/en-US.json";
import locale_fi from "./lang/fi-FI.json";

const translations = {
    'en': locale_en,
    'fi': locale_fi
}

let userLocale
if (localStorage.getItem("userLocale")) {
    userLocale = localStorage.getItem("userLocale")
} else if (navigator.language.split(/[-_]/)[0] === 'en' || navigator.language.split(/[-_]/)[0] === 'fi') {
    userLocale = navigator.language.split(/[-_]/)[0] // split() removes region code
} else {
    userLocale = 'en'
}

export const LocaleContext = React.createContext(userLocale)

export default function LocaleWrapper( {children} ) {
    const [locale, setLocale] = useState(useContext(LocaleContext))

    function changeLocale(lang) {
        setLocale(lang)
        localStorage.setItem("userLocale", lang);
    }

    return (
        <LocaleContext.Provider value={{locale, changeLocale}}>
            <IntlProvider locale={locale} defaultLocale={'en'} key={locale} messages={translations[locale]}>
                {children}
            </IntlProvider>
        </LocaleContext.Provider>
    )
}

export function LocaleSwitcher() {
    const {locale, changeLocale} = useContext(LocaleContext)
    const translationNames = Object.keys(translations)
    return (<div className={"locale-container"}>
        <div className={"locale-switcher"}>
            {translationNames.map((lang) => (
                <p onClick={() => changeLocale(lang)} className={locale === lang ? "active" : ""} key={lang}>
                    {lang}
                </p>
            ))}
        </div>
    </div>
    )
}