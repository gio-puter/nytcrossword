import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SearchResults.css"
import supabase from "../supabase";

function SearchResults() {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const [inputClue, setInputClue] = useState("");
    const [inputAnswerLength, setInputAnswerLength] = useState("");
    const [inputAnswer, setInputAnswer] = useState("");

    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const clue = queryParams.get("clue")
    const answer = queryParams.get("answer")
    const answerLength = queryParams.get("answerLength")

    useEffect(() => {
        if (clue) {
            fetchAnswers();
        }
        if (answer) {
            fetchClues();
        }
    }, [location.search])


    async function fetchAnswers() {
        const {data, error} = await supabase.rpc('fetch_answers', {word : clue, answer_length: answerLength})

        if (error) {
            // console.error('Error fetching data', error)
            handleError(error);
        } else {
            // console.log('Data: ', data)
            handleSuccess(data, clue, "answer");
        }
    }

    async function fetchClues() {
        const {data, error} = await supabase.rpc('fetch_clues', {word: answer})
        
        if (error) {
            // console.error('Error fetching data', error)
            handleError(error);
        } else {
            // console.log('Data: ', data)
            handleSuccess(data, answer, "clue");
        }
    }

    function handleError(error) {
        let message;
        switch (error.code) {
            case "22P02":
                message = "INVALID PARAMETERS";
                break;
            case "08003":
                message = "DATABASE CONNECTION ERROR. TRY AGAIN LATER";
                break;
            default:
                message = "UNEXPECTED ERROR. TRY A DIFFERENT INPUT";
        }
        setError(<p style={{ color: "red" }}>{message}</p>);
        setResult(null);
    }

    function handleSuccess(data, query, type) {
        if (data.length === 0) {
            setError(<p style={{ color: "red" }}>NO {type.toUpperCase()}S FOUND FOR: {query}</p>)
            setResult(null)
        } else {
            // Sort results alphabetically before rendering
            data.sort((a, b) => {
                if (type === "answer") {
                    return a.answer.localeCompare(b.answer);
                } else if (type === "clue") {
                    return a.clue.localeCompare(b.clue);
                }
            });

            const out = data.map((row, index) => (
                <p key={index}>{type === "answer" ? row.answer : row.clue}</p>
            ));

            setResult(out);
            setError(null);
        }
    }

    function handleClueSearch() {
        let searchString = `/search/?clue=${encodeURIComponent(inputClue)}`
        if (inputAnswerLength) {
            searchString += `&answerLength=${encodeURIComponent(inputAnswerLength)}`
        }
        navigate(searchString);
    }

    function handleAnswerSearch() {
        if (!inputAnswer.replace(/\s+/g,'')) {return}
        
        let searchString = `/search/?answer=${encodeURIComponent(inputAnswer.replace(/\s+/g,'').toUpperCase())}`
        navigate(searchString);
    }

    function handleClueKeyDown(event) {
        if (event.key === "Enter" && inputClue) {handleClueSearch()}
    }

    function handleAnswerKeyDown(event) {
        if (event.key === "Enter" && inputAnswer) {handleAnswerSearch()}
    }

    return (
        <>
            <h1>Search Results</h1>

            <div className="container">
                <div className="search-section">
                    <input type='text' placeholder='Clue' value={inputClue} onChange={(e) => setInputClue(e.target.value)} onKeyDown={handleClueKeyDown}></input>
                    <input type='text' placeholder='Answer Length' value={inputAnswerLength} onChange={(e) => setInputAnswerLength(e.target.value)} onKeyDown={handleClueKeyDown}></input>
                    <button onClick={handleClueSearch}>Search Clue</button>
                </div>

                <div className="search-section">
                    <input type='text' placeholder='Answer' value={inputAnswer} onChange={(e) => setInputAnswer(e.target.value)} onKeyDown={handleAnswerKeyDown}></input>
                    <button onClick={handleAnswerSearch}>Search Answer</button>
                </div>
            </div>

            {error && (<div>{error}</div>)}

            {clue && !error && (<div><p>Showing answer(s) to: {clue}</p></div>)}
            {answer && !error && (<div><p>Showing clue(s) for: {answer}</p></div>)}
            {result && !error && (
                <div className={`results-container ${result.length >= 3 ? "three-columns" : ""}`}>
                    {result}
                </div>
            )}

        </>
    );

}

export default SearchResults