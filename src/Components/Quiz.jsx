import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./Quiz.css"
import supabase from "../supabase";

function Quiz() {
    const [inputValues, setInputValues] = useState(Array().fill(''));
    const [hintsUsed, setHintsUsed] = useState(Array().fill(false));
    const [finished, setFinished] = useState(false);

    const [clue, setClue] = useState(null);
    const [answer, setAnswer] = useState(null);

    const [answerResponse, setAnswerResponse] = useState(null);
    const NEW_CLUE_WAIT_TIME = 1500;

    const location = useLocation();

    useEffect(() => {
        if (!clue) {
            fetchClue();
        }
    }, [location.search]);

    async function fetchClue() {
        const {data, error} = await supabase.rpc('fetch_random');

        if (error) {
            // console.error('Error fetching data', error);
        } else {
            // console.log('Data: ', data[0]);
            setClue(data[0].clue);
            setAnswer(data[0].answer)
            setAnswerResponse(null)

            setHintsUsed(Array(data[0].answer.length).fill(false))
            setInputValues(Array(data[0].answer.length).fill(''))
            setFinished(false)
            return data;
        }
    }

    const handleInputChange = (e, index) => {
        const value = e.target.value.toUpperCase();
        console.log(value)

        if (value.match(/^[A-Z0-9]$/)) {
            const newValues = [...inputValues];
            newValues[index] = value;
            setInputValues(newValues);
            
            // Focus the next empty box if available
            const nextEmptyIndex = newValues.findIndex((v, i) => v === '' && i > index);
            if (nextEmptyIndex !== -1) {
                document.getElementById(`input-${nextEmptyIndex}`).focus();
            }
            setAnswerResponse(null)
        } 

    };

    const handleHint = () => {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * answer.length);
        } while (hintsUsed[randomIndex]);

        const newValues = [...inputValues];
        newValues[randomIndex] = answer[randomIndex].toUpperCase();

        const newHints = [...hintsUsed];
        newHints[randomIndex] = true

        setInputValues(newValues);

        if (newValues.join('') === answer) {
            setFinished(true);
            setHintsUsed(Array(answer.length).fill(true))
            setAnswerResponse(<p style={{ color: "green" }}>Correct!</p>);
            setTimeout(finishedClue, NEW_CLUE_WAIT_TIME);
        } else {
            setHintsUsed(newHints);
        }

    };

    const handleReveal = () => {
        setInputValues(answer.split(''));
        setFinished(true);
        setHintsUsed(Array(answer.length).fill(true))
        setAnswerResponse(<p style={{ color: "green" }}>Correct!</p>);
        setTimeout(finishedClue, NEW_CLUE_WAIT_TIME);
    }

    async function handleAnswerSearch() {
        if (inputValues.join('') === answer) {
            setFinished(true)
            setHintsUsed(Array(answer.length).fill(true))
            setAnswerResponse(<p style={{ color: "green" }}>Correct!</p>)
            setTimeout(finishedClue, NEW_CLUE_WAIT_TIME);
            return
        }

        if (inputValues.join('').length != answer.length) {
            setAnswerResponse(<p style={{ color: "red" }}>Fill out the rest of the boxes</p>)
            return;
        }

        const {data, error} = await supabase.rpc('check_answer', {clue: clue, answer: inputValues.join('').toUpperCase()})

        if (error) {
            // console.error('Error fetching data', error);
        } else {
            // console.log(data)
            if (data) {
                setFinished(true)
                setHintsUsed(Array(answer.length).fill(true))
                setAnswerResponse(<p style={{ color: "green" }}>Correct!</p>)
                setTimeout(finishedClue, NEW_CLUE_WAIT_TIME);
            } else {
                setAnswerResponse(<p style={{ color: "red" }}>Incorrect!</p>)
            }
            return data;
        }
    }

    function handleAnswerKeyDown(event, index) {
        if (event.key === "Enter" && inputValues.join('')) {handleAnswerSearch()}
        else if (event.key === "Backspace") {
            const newValues = [...inputValues]
            if (newValues[index] !== '') {
                const newValues = [...inputValues];
    
                newValues[index] = '';
                setInputValues(newValues);
            } else {
                // Focus the nearest previous non-disabled box if available
                let prevIndex = index - 1;
                while (prevIndex >= 0 && hintsUsed[prevIndex]) {
                    prevIndex--;
                }
    
                if (prevIndex >= 0) {
                    document.getElementById(`input-${prevIndex}`).focus();
                }
            }
            setAnswerResponse(null)

        }
        else if (event.key.match(/^[A-Za-z0-9]$/)) {
            const newValues = [...inputValues]
            console.log(newValues[index] === '')
            try {
                if (newValues[index] !== '' && newValues[index + 1] == '') {
                    newValues[index + 1] = event.key.toUpperCase();
                    document.getElementById(`input-${index + 1}`).focus();
                }
            } catch (error) {

            }
        }
    }

    function finishedClue() {
        fetchClue()
    }

    return (
        <>
            <h1>Quiz</h1>
            <button onClick={fetchClue}>New Clue</button>
            <br></br>
            <div className="word-guess-container">
                <p className='clue'>{clue}:</p>

                <div className="input-boxes">
                    {inputValues.map((letter, index) => (
                        <input
                            key={index}
                            id={`input-${index}`}
                            type="text"
                            maxLength="1"
                            value={letter}
                            onChange={(e) => handleInputChange(e, index)}
                            className="letter-input"
                            disabled={hintsUsed[index]}
                            onKeyDown={(e) => handleAnswerKeyDown(e, index)}
                        />
                    ))}
                </div>

                <div className='button-row'>
                    <button className="hint-button" onClick={handleHint} disabled={finished}>
                        Use Hint
                    </button>
                    <button className="hint-button" onClick={handleReveal} disabled={finished}>
                        Reveal Answer
                    </button>
                </div>

                <button className="submit-button" onClick={handleAnswerSearch} disabled={finished}>Submit Answer</button>

                {answerResponse && (<div>{answerResponse}</div>)}
            </div>
        </>
    );

}

export default Quiz;