import React from "react"
import './scss/App.scss'
import {
    QueryClient,
    QueryClientProvider,
} from "react-query"
import {
    BrowserRouter as Router,
} from "react-router-dom"
import Content from "./Content"
import LocaleWrapper from "./LocaleContext"

export const queryClient = new QueryClient()

function App() {
    return <QueryClientProvider client={queryClient}>
        <LocaleWrapper>
            <Router basename={"/admin"}>
                <div className={"app"}>
                    <Content />
                </div>
            </Router>
        </LocaleWrapper>
    </QueryClientProvider>
}

export default App;