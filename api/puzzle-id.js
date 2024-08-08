import { createClient } from "@supabase/supabase-js";
import axios from "axios";

export default async function getRecentPuzzleID(req, res) {
    try {
        const puzzleResp = await axios.get("https://www.nytimes.com/svc/crosswords/v3/puzzles.json", {
            headers: {Cookie: `NYT-S=${process.env.NYT_COOKIE}`},
        });
        console.log(puzzleResp);
        const puzzleInfo = puzzleResp.data.results[0];
        const puzzleId = puzzleInfo.puzzle_id;
        res.status(200).json({ puzzleId: puzzleId});
    } catch (error) {
        res.status(200).json({ message: 'It no work' });
    }
}