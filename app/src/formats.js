import {FormattedMessage} from "react-intl";
import {useEffect, useState} from "react";

export function getStudentFromContacts(student, contacts) {
    return contacts.find(contact => contact.id === student)
}

export function GetDifferenceText(dateDifference) {
    const time = getTimes(dateDifference)
    if (time.year > 0) {
        if (time.year > 1) {
           return <FormattedMessage
               id={"overNYearsAgo"}
               defaultMessage={"Over {n} years ago"}
               values={{n: time.year}}/>
        } else {
            return <FormattedMessage
                id={"overAYearAgo"}
                defaultMessage={"Over a year ago"} />
        }
    }
    if (time.month > 0) {
        if (time.month > 1) {
            return <FormattedMessage
                id={"overNMonthsAgo"}
                defaultMessage={"Over {n} months ago"}
                values={{n: time.month}}/>
        } else {
            return <FormattedMessage
                id={"overAMonthAgo"}
                defaultMessage={"Over a month ago"} />
        }
    }
    if (time.week > 0) {
        if (time.week > 1) {
            return <FormattedMessage
                id={"overNWeeksAgo"}
                defaultMessage={"Over {n} weeks ago"}
                values={{n: time.week}}/>
        } else {
            return <FormattedMessage
                id={"overAWeekAgo"}
                defaultMessage={"Over a week ago"} />
        }
    }
    if (time.day > 0) {
        if (time.day > 1) {
            return <FormattedMessage
                id={"overNDaysAgo"}
                defaultMessage={"Over {n} days ago"}
                values={{n: time.day}}/>
        } else {
            return <FormattedMessage
                id={"aDayAgo"}
                defaultMessage={"A day ago"} />
        }
    }
    if (time.hour > 0) {
        if (time.hour > 1) {
            return <FormattedMessage
                id={"overNHoursAgo"}
                defaultMessage={"Over {n} hours ago"}
                values={{n: time.hour}}/>
        } else {
            return <FormattedMessage
                id={"anHourAgo"}
                defaultMessage={"An hour ago"} />
        }
    }
    return <FormattedMessage
        id={"aMomentAgo"}
        defaultMessage={"A moment ago"}/>

}

function getTimes(t) {
    let year, month, week, day, hour, minute, second

    second = Math.floor(t / 1000)
    minute = Math.floor(second / 60)
    second = second % 60
    hour = Math.floor(minute / 60)
    minute = minute % 60
    day = Math.floor(hour / 24)
    hour = hour % 24
    month = Math.floor(day / 30)
    week = Math.floor( day / 7 )
    day = day % 30
    year = Math.floor(month / 12)
    month = month % 12
    week = week % 52

    return { year, month, week, day, hour, minute, second }
}

export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches)
        }
        const listener = () => setMatches(media.matches)
        window.addEventListener("resize", listener)
        return () => window.removeEventListener("resize", listener)
    }, [matches, query])

    return matches
}

export function formatDate(date) {
    const formatted = date.replace(/\s/g, 'T') + ":00"
    return formatted
}