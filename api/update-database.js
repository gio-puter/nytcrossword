import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function updateDatabase(request, response) {
    try {
        const puzzleId = await getRecentPuzzleID();

        const puzzle = await fetch(`https://www.nytimes.com/svc/crosswords/v2/puzzle/${puzzleId}.json`, {
            headers: { 'Cookie': `NYT-S=${process.env.NYT_COOKIE}` }
        });

        const puzzleResp = await puzzle.json()
        
        const puzzleData = puzzleResp.results[0];

        const puzzleWidth = puzzleData.puzzle_meta.width;
        const puzzleDotw = puzzleData.puzzle_meta.printDotw;
        const puzzleDate = puzzleData.print_date;
        const acrossClues = puzzleData.puzzle_data.clues.A;
        const downClues = puzzleData.puzzle_data.clues.D;
        const puzzleFill = puzzleData.puzzle_data.answers;

        const acrossSet = setFromClues(acrossClues, puzzleDate, puzzleDotw, puzzleFill)
        const downSet = setFromClues(downClues, puzzleDate, puzzleDotw, puzzleFill, puzzleWidth)

        const answerSet = [...acrossSet, ...downSet]

        const {data, error} = await supabase
            .from("daily_answers")
            .upsert(answerSet, {onConflict: ['clue', 'answer'], ignoreDuplicates: true});

        if (error) {
            return response.status(500).json({ message: 'Failed to update the database', error: error.message})
        }

        return response.status(200).json({ message: 'Database successfully updated', pushedSet: answerSet});
    } catch (error) {
        return response.status(500).json({ message: 'Failed to update the database', error: error.message})
    }

}

function setFromClues(clueSet, puzzleDate, puzzleDotw, puzzleFill, step = 1) {
    const tempSet = new Set();
    clueSet.forEach((clue) => {
    const key = clue.value;
    // if (!checkClue(clue)) { return; }
    try {
        const answer = puzzleFill.slice(clue.clueStart, clue.clueEnd + 1)
            .filter((_, i) => i % step === 0).join("");
        if (answer.includes(",")) { return; }

        const puzzleDict = {
            clue: key,
            answer: answer,
            date: puzzleDate,
            dotw: parseInt(puzzleDotw, 10),
        };

        tempSet.add(puzzleDict)
    } catch (error) {
        console.error("Error processing clue:", error);
    }
    });
    return tempSet;
}

async function getRecentPuzzleID() {
    try {
        const puzzleResp = await fetch("https://www.nytimes.com/svc/crosswords/v3/puzzles.json", {
            headers: { 'Cookie': `NYT-S=${process.env.NYT_COOKIE}` }
        });

        if (!puzzleResp.ok) {
            throw new Error('Network response was not ok');
        }

        const puzzleData = await puzzleResp.json();
        const puzzleInfo = puzzleData.results[0];
        const puzzleId = puzzleInfo.puzzle_id;
        return puzzleId
    } catch (error) {
        throw new Error(`Something bad happened: ${error}`)
    }
}

