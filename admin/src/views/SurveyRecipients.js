import {useIntl} from "react-intl";
import React, {useEffect, useMemo, useRef, useState} from "react";
import '../scss/SurveyRecipients.scss';
import {useContactsData, useSurveyData} from "./SurveyView";
import { useTable, useRowSelect, useSortBy, useAsyncDebounce, useFilters, useGlobalFilter, useFlexLayout, usePagination } from 'react-table'
import {getStudentFromContacts, getStudentName} from "../DataFunctions";
import {ReactComponent as CloseIcon} from "../svg/close.svg";
import {ReactComponent as Minimize} from "../svg/minimize-s.svg";
import {ReactComponent as Maximize} from "../svg/maximize.svg";
import {ReactComponent as Previous} from "../svg/previous.svg";
import {ReactComponent as Next} from "../svg/next.svg";
import {ReactComponent as First} from "../svg/first.svg";
import {ReactComponent as Last} from "../svg/last.svg";

export default function SurveyRecipients() {
    return <div className={"survey-recipients"}>
        <SurveyRecipientsContent />
        <TableRender />
    </div>
}

function SurveyRecipientsContent() {
    const {surveyData, setSurveyData} = useSurveyData()
    const {contactsData} = useContactsData()
    const surveyContacts = surveyData.contacts
    const intl = useIntl()
    const [showContacts, setShowContacts] = useState(false)
    const [showEmptyConfirm, setShowEmptyConfirm] = useState(false)
    const [showSummary, setShowSummary] = useState(localStorage.getItem("showRecipientSummary") ? JSON.parse(localStorage.getItem("showRecipientSummary")) : true)
    const limitedEditing = surveyData.status === "IN PROGRESS" || surveyData.status === "FINISHED"

    const removeStudentFromSurvey = (user) => {
        const newSurveyData = {...surveyData}
        const index = newSurveyData.contacts.indexOf(user)
        if (index > -1) {
            newSurveyData.contacts.splice(index, 1)
        }
        setSurveyData(newSurveyData)
    }

    const emptySurveyOfContacts = () => {
        const newSurveyData = {...surveyData}
        newSurveyData.contacts = []
        setSurveyData(newSurveyData)
        setShowEmptyConfirm(false)
    }

    let studentList
    studentList = surveyContacts && !showContacts ? surveyContacts.slice(0,8) : surveyContacts

    const surveyContactsDetails = surveyContacts && surveyContacts.map(student => getStudentFromContacts(student, contactsData))
    const surveyDegrees = surveyContactsDetails && surveyContactsDetails.map(student => student["contact"]["degree"])
    const surveyGroups = surveyContactsDetails && surveyContactsDetails.map(student => student["contact"]["group"])
    const surveyLocations = surveyContactsDetails && surveyContactsDetails.map(student => student["contact"]["location"])

    const summaryData = [
        {
            header: "Groups",
            keys: surveyGroups && surveyGroups.filter(filterUnique),
            allKeys: surveyGroups
        },
        {
            header: "Degrees",
            keys: surveyDegrees && surveyDegrees.filter(filterUnique),
            allKeys: surveyDegrees
        },
        {
            header: "Locations",
            keys: surveyLocations && surveyLocations.filter(filterUnique),
            allKeys: surveyLocations
        }
    ]

    function filterUnique(value, index, self) {
        return self.indexOf(value) === index
    }

    const RenderSummary = () => {
        return summaryData.map((obj, i) => {
            return <RenderSummaryGroup obj={obj} key={i} />
        })
    }

    function RenderSummaryGroup({obj}) {
        const [maximizeGroup, setMaximizeGroup] = useState(false)
        const keys = obj && maximizeGroup ? obj.keys : obj.keys.slice(0,5)
        const extra = obj.keys.length - 5

        return <div className={"summary-group"}>
            <p>
                {obj.header} ({obj.keys.length}):
            </p>
            <div className={"summary-objects-container"}>
                {keys.map((key, i) => {
                    let amount = 0
                    for (let i = 0; i < obj.allKeys.length; i++) {
                        if (obj.allKeys[i] === key) {
                            amount++
                        }
                    }
                    if (key) {
                        return <div className={"summary-object"} key={i}>{key} ({amount})</div>
                    }
                    return <div className={"summary-object"} key={i}>
                        {intl.formatMessage(
                            {
                                id: 'survey.table.empty',
                                defaultMessage: '(Empty)',
                            })} ({amount})</div>
                })}
                {extra > 0 && !maximizeGroup &&
                    <button className={"text"} onClick={()=>setMaximizeGroup(true)}>
                        + {extra} {intl.formatMessage(
                        {
                            id: 'survey.table.more',
                            defaultMessage: 'more',
                        })}</button>
                }
                {maximizeGroup &&
                <button className={"text"} onClick={()=>setMaximizeGroup(false)}>
                    - {intl.formatMessage(
                    {
                        id: 'minimize',
                        defaultMessage: 'Minimize',
                    })}
                </button>
                }
            </div>
        </div>
    }

    return <div className={"survey-recipients-container"}>
        <h4>
            <span>
            {intl.formatMessage(
                {
                    id: 'survey.contacts.recipients',
                    defaultMessage: 'Survey Recipients',
                })}
            {surveyContacts && !surveyContacts.length < 1 &&
            <> ({surveyContacts.length})</>
            }
            </span>
            {surveyContacts && !surveyContacts.length < 1 && !limitedEditing &&
            <span className={"empty-list"}>
                {!showEmptyConfirm ?
                <button className={"text"} onClick={()=>setShowEmptyConfirm(true)}>
                    {intl.formatMessage(
                        {
                            id: 'survey.contacts.emptyList',
                            defaultMessage: 'Empty List',
                        })}
                </button> :
                    <span>
                        {intl.formatMessage(
                            {
                                id: 'areYouSure',
                                defaultMessage: 'Are you sure?',
                            })} <button className={"text red"} onClick={()=>emptySurveyOfContacts()}>
                    {intl.formatMessage(
                        {
                            id: 'yes',
                            defaultMessage: 'Yes',
                        })}
                </button> / <button className={"text"} onClick={()=>setShowEmptyConfirm(false)}>
                    {intl.formatMessage(
                        {
                            id: 'no',
                            defaultMessage: 'No',
                        })}
                </button>
                    </span>
                }

            </span>
            }
        </h4>
        <div>
            {!surveyContacts || surveyContacts.length < 1 ?
                <p className={"placeholder"}>
                    {intl.formatMessage(
                        {
                            id: 'survey.contacts.noRecipients',
                            defaultMessage: 'This survey doesn\'t have any recipients yet. Start by adding from the table below.',
                        })}
                </p> :
                <>
                    <div className={"frame"}>
                        <div className={"recipients-container"}>
                            {studentList.map((obj, i) => {
                                let student = getStudentFromContacts(obj, contactsData)
                                let name = getStudentName(student, intl)
                                return <div className="block round" key={i}>
                                    <span>{name}</span>
                                    {!limitedEditing &&
                                    <div className={"close-icon"} onClick={() => removeStudentFromSurvey(obj)}>
                                        <CloseIcon/>
                                    </div>
                                    }
                                </div>
                            })}
                            {surveyContacts.length > 8 &&
                            <button className={"block round show-all"} onClick={()=>setShowContacts(!showContacts)}>
                                {!showContacts ?
                                    <>
                                        <Maximize />
                                        {intl.formatMessage(
                                            {
                                                id: 'showAll',
                                                defaultMessage: 'Show All',
                                            })
                                        }</> :
                                    <>
                                        <Minimize />
                                        {intl.formatMessage(
                                            {
                                                id: 'minimize',
                                                defaultMessage: 'Minimize',
                                            })}
                                    </>
                                }
                            </button>
                            }
                        </div>
                    </div>
                    <h4>
                        <span className={!showSummary ? "hidden" : ""}>
                        {intl.formatMessage(
                            {
                                id: 'survey.contacts.summary',
                                defaultMessage: 'Summary.',
                            })}
                            </span>
                        <button className={"text"} onClick={()=> {
                            localStorage.setItem("showRecipientSummary", JSON.stringify(!showSummary))
                            setShowSummary(!showSummary)
                        }}>
                            {showSummary ?
                                intl.formatMessage(
                                    {
                                        id: 'hide',
                                        defaultMessage: 'Hide',
                                    }) :
                                intl.formatMessage(
                                    {
                                        id: 'show',
                                        defaultMessage: 'Show',
                                    })}
                        </button>
                    </h4>
                    {showSummary &&
                    <RenderSummary />
                    }
                </>
            }
        </div>
    </div>
}

function TableRender() {
    const intl = useIntl()
    const {contactsData} = useContactsData()
    let contactHeaders = []
    for (let i = 0; i < contactsData.length; i++) {
        if (contactsData[i].hasOwnProperty("contact")) {
            for (const [key] of Object.entries(contactsData[i]["contact"])) {
                contactHeaders.indexOf(key) === -1 && contactHeaders.push(key)
            }
        }
    }
    const columnArray = contactHeaders.map( header => {
        const useDropdown = header === 'group' || header === 'location' || header === 'degree'
        if (useDropdown) {
            return {
                Header: header,
                accessor: `contact.${header}`,
                Filter: MultiSelectColumnFilter,
                filter: filterIncludes,
                width: 200
            }
        }
        return {
            Header: header,
            accessor: `contact.${header}`,
            width: 200
        }
    })

    const data = useMemo(() => contactsData, [contactsData])
    const columns = useMemo(()=> columnArray, [columnArray])

    function MultiSelectColumnFilter({column: { filterValue, setFilter, preFilteredRows, id }}) {
        const [showOptions, setShowOptions] = useState(false)
        const refOptions = useRef(null)
        const refOptionsToggle = useRef(null)
        useEffect(()=>{
            document.addEventListener("mousedown", handleClickOutside)
            function handleClickOutside(event) {
                if (refOptions.current && !refOptions.current.contains(event.target) && !refOptionsToggle.current.contains(event.target)) {
                    setShowOptions(false)
                }
                return () => {
                    document.removeEventListener("mousedown", handleClickOutside);
                }
            }
        },[refOptions])

        const options = React.useMemo(() => {
            const options = new Set()
            preFilteredRows.forEach(row => {
                options.add(row.values[id])
            })
            options.delete(null)
            options.add("missing")
            return [...options.values()]
        }, [id, preFilteredRows])

        const toggleFilter = option => {
            if (!filterValue) {
                setFilter([option])
            } else if (filterValue.includes(option)) {
                const index = filterValue.indexOf(option)
                if (index > -1) {
                    const newFilter = filterValue
                    newFilter.splice(index, 1)
                    setFilter(newFilter)
                }
            } else {
                const newFilter = filterValue
                newFilter.push(option)
                setFilter(newFilter)
            }
        }

        return <>
            <div className={"selected-filters-container"} onClick={e=>e.stopPropagation()}>
                <div ref={refOptionsToggle} className={"selected-filters"} onClick={()=>setShowOptions(!showOptions)}>
                    {filterValue ?
                        filterValue.length < 1 ? intl.formatMessage(
                            {
                                id: 'survey.table.showAll',
                                defaultMessage: 'Show All',
                            }) :
                        filterValue.map((filter, i) => {
                            if (filterValue.length === 1) {
                                return filter
                            }
                            if (filterValue.length === i + 1) {
                                return filter
                            }
                            return filter + ", "
                        }) : intl.formatMessage(
                            {
                                id: 'survey.table.showAll',
                                defaultMessage: 'Show All',
                            })
                    }
                </div>
                {showOptions &&
                <div ref={refOptions} className={"filter-options"}>
                    <div onClick={()=>setFilter("")}>
                        <input type={"checkbox"} readOnly={true} checked={filterValue === "" || filterValue === [] || !filterValue || filterValue.length < 1} />
                        {intl.formatMessage(
                            {
                                id: 'survey.table.showAll',
                                defaultMessage: 'Show All',
                            })}
                    </div>
                    {options.map((option, i) => (
                        <div key={i} onClick={()=>toggleFilter(option)}>
                            <input type={"checkbox"} readOnly={true} checked={filterValue !== undefined && filterValue && filterValue.includes(option)} />
                            {option === "missing" ?
                                intl.formatMessage(
                                    {
                                        id: 'survey.table.empty',
                                        defaultMessage: '(Empty)',
                                    })
                                : option}
                        </div>
                    ))}
                </div>
                }
            </div>
        </>
    }

    function filterIncludes(rows, id, filterValue) {
        return rows.filter(row => {
            const rowValue = row.values[id]
            if (!filterValue || filterValue.length < 1) {
                return true
            }
            if (filterValue.includes("missing") && !rowValue) {
                return true
            }
            return filterValue.includes(rowValue)
        })
    }

    return <Table columns={columns} data={data} />
}

function GlobalFilter({globalFilter, setGlobalFilter}) {
    const intl = useIntl()
    const [value, setValue] = useState(globalFilter)
    const onChange = useAsyncDebounce(value => {
        setGlobalFilter(value || undefined)
    }, 50)

    return <input value={value || ""} className={"search-user"} type={"text"}
                  onChange={e => {
                      setValue(e.target.value);
                      onChange(e.target.value);
                  }}
                  placeholder={intl.formatMessage(
                      {
                          id: 'survey.contacts.searchFromContacts',
                          defaultMessage: 'Search Contacts',
                      })}
    />
}

function Table({columns, data}) {
    const {surveyData, setSurveyData} = useSurveyData()
    const limitedEditing = surveyData.status === "IN PROGRESS" || surveyData.status === "FINISHED"
    const intl = useIntl()

    function DefaultColumnFilter({column: { filterValue, setFilter }}) {
        return (
            <input
                type={"text"}
                onClick={e => e.stopPropagation()}
                value={filterValue || ''}
                onChange={e => {setFilter(e.target.value || undefined)}}
                placeholder={'Search'}
            />
        )
    }

    const IndeterminateCheckbox = React.forwardRef(
        ({ indeterminate, ...rest }, ref) => {
            const defaultRef = React.useRef()
            const resolvedRef = ref || defaultRef

            React.useEffect(() => {
                resolvedRef.current.indeterminate = indeterminate
            }, [resolvedRef, indeterminate])

            return <input type="checkbox" ref={resolvedRef} {...rest} />
        }
    )

    const defaultColumn = React.useMemo(() => ({
            Filter: DefaultColumnFilter
    }), [])

    const pageSizeFromStorage = localStorage.getItem("pageSize") ? Number(localStorage.getItem("pageSize")) : 50

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        prepareRow,
        selectedFlatRows,
        preGlobalFilteredRows,
        setGlobalFilter,
        state,
        state: {pageIndex, pageSize},
    } = useTable(
        {
            columns,
            data,
            defaultColumn,
            initialState: {pageIndex: 0, pageSize: pageSizeFromStorage}
        },
        useFilters,
        useGlobalFilter,
        useSortBy,
        useFlexLayout,
        usePagination,
        useRowSelect,
        hooks => {
            if (!limitedEditing) {
                hooks.visibleColumns.push(columns => [
                    {
                        id: 'selection',
                        width: 36,
                        Header: ({getToggleAllRowsSelectedProps}) => (
                            <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
                        ),
                        Cell: ({row}) => (
                            <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
                        ),
                    },
                    ...columns,
                ])
            }
        }
    )

    const selectedContactsId = selectedFlatRows.map(row => row.original.id)
    const AddContactsToSurvey = () => {
        let newSurveyData = {...surveyData}
        for (let i = 0; i < selectedContactsId.length; i++) {
            if (!newSurveyData.contacts) {
                newSurveyData.contacts = []
            }
            if (!newSurveyData.contacts.includes(selectedContactsId[i])) {
                newSurveyData.contacts.push(selectedContactsId[i])
            }
        }
        setSurveyData(newSurveyData)
    }

    const RemoveContactsFromSurvey = () => {
        let newSurveyData = {...surveyData}
        for (let i = 0; i < selectedContactsId.length; i++) {
            if (newSurveyData.contacts.includes(selectedContactsId[i])) {
                const index = newSurveyData.contacts.indexOf(selectedContactsId[i])
                if (index > -1) {
                    newSurveyData.contacts.splice(index, 1)
                }
            }
        }
        setSurveyData(newSurveyData)
    }

    return <div className={"contact-table-container"}>
        <h4>
            {intl.formatMessage(
                {
                    id: 'survey.contacts.allContacts',
                    defaultMessage: 'All Contacts',
                })}
        </h4>
        <div className={"toolbar-container"}>
            <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={state.globalFilter}
                setGlobalFilter={setGlobalFilter}
            />
            {!limitedEditing &&
            <>
                <button disabled={selectedFlatRows.map(row => row.original.id).length < 1} className={"remove"} onClick={()=>RemoveContactsFromSurvey()}>{intl.formatMessage(
                    {
                        id: 'survey.contacts.removeFromSurvey',
                        defaultMessage: '- Remove Selected',
                    })}
                    {selectedFlatRows && selectedFlatRows.length > 0 &&
                    <> ({selectedFlatRows.length})</>}
                </button>
                <button disabled={selectedFlatRows.map(row => row.original.id).length < 1} className={"add"} onClick={()=>AddContactsToSurvey()}>{intl.formatMessage(
                    {
                        id: 'survey.contacts.addToSurvey',
                        defaultMessage: '+ Add Selected',
                    })}
                    {selectedFlatRows && selectedFlatRows.length > 0 &&
                    <> ({selectedFlatRows.length})</>}
                </button>
            </>
            }
        </div>
        <div className={"table-container"}>
            <table {...getTableProps()} className={"contact-table"}>
                <thead>
                {
                    headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                    {column.render('Header')}
                                    {column.isSorted &&
                                    <span>
                                    {column.isSortedDesc ?
                                        ' 🔽' :
                                        ' 🔼'
                                    }
                                </span>
                                    }
                                    {column.canFilter ? <div>{column.render('Filter')}</div> : null}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()} style={{minHeight: pageOptions.length > 1 ? 42*pageSize : ""}}>
                {
                    page.map(row => {
                        prepareRow(row)
                        return (
                            <tr className={surveyData.contacts && surveyData.contacts.includes(row.original.id) ? "in-survey" : ""} {...row.getRowProps()}>
                                {row.cells.map(cell => {
                                    return <td title={cell.value} {...cell.getCellProps()}>
                                        {cell.render('Cell')}
                                    </td>
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
        <div className="pagination">
            <select
                value={pageSize}
                onChange={e => {
                    setPageSize(Number(e.target.value))
                    localStorage.setItem("pageSize", e.target.value)
                }}
            >
                {[10, 50, 100, 200, 500].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                        {intl.formatMessage(
                            {
                                id: 'surveys.recipients.table.show',
                                defaultMessage: 'Show',
                            })}{' '}
                        {pageSize}
                    </option>
                ))}
            </select>
            <div className={"page-index"}>
                {intl.formatMessage(
                    {
                        id: 'surveys.recipients.table.page',
                        defaultMessage: 'Page',
                    })}{' '}
                <strong>
            {pageIndex + 1}{' '}
                    {intl.formatMessage(
                        {
                            id: 'surveys.recipients.table.of',
                            defaultMessage: 'of',
                        })}
                    {' '}{pageOptions.length}
          </strong>
        </div>
            <div className={"buttons"}>
                <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                    <First/>
                </button>{' '}
                <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                    <Previous/>
                </button>{' '}
                <button onClick={() => nextPage()} disabled={!canNextPage}>
                    <Next />
                </button>{' '}
                <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                    <Last/>
                </button>
            </div>
        </div>
    </div>
}