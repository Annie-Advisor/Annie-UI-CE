import React, {useContext, useState} from 'react'
import {IntlProvider} from "react-intl"
import locale_en from "./lang/en-US.json";
import locale_fi from "./lang/fi-FI.json";
import locale_sv from "./lang/sv-SE.json"

const translations = {
    'fi': locale_fi,
    'sv': locale_sv,
    'en': locale_en
}

const languageNames = {
    'fi': "Suomi",
    'sv': "Svenska",
    'en': "English"
}

let userLocale
if (localStorage.getItem("userLocale")) {
    userLocale = localStorage.getItem("userLocale")
} else if (navigator.language.split(/[-_]/)[0] === 'en' || navigator.language.split(/[-_]/)[0] === 'fi' || navigator.language.split(/[-_]/)[0] === 'sv') {
    userLocale = navigator.language.split(/[-_]/)[0] // split() removes region code
} else {
    userLocale = 'en'
}
document.documentElement.lang = userLocale

export const LocaleContext = React.createContext(userLocale)

export default function LocaleWrapper( {children} ) {
    const [locale, setLocale] = useState(useContext(LocaleContext))

    function changeLocale(lang) {
        setLocale(lang)
        localStorage.setItem("userLocale", lang)
        document.documentElement.lang = lang
    }

    return (
        <LocaleContext.Provider value={{locale, changeLocale}}>
            <IntlProvider locale={locale} defaultLocale={'fi'} key={locale} messages={translations[locale]}>
                {children}
            </IntlProvider>
        </LocaleContext.Provider>
    )
}

export function LocaleSwitcher() {
    const {locale, changeLocale} = useContext(LocaleContext)
    const translationNames = Object.keys(translations)
    return (<div className={"locale-container"}>
            <select className={"locale-switcher"} value={locale} onChange={e=>changeLocale(e.target.value)}>
                {translationNames.map((lang) => {
                   return <option value={lang} key={lang}>
                        {languageNames[lang]}
                </option>
                })}
            </select>
        </div>
    )
}