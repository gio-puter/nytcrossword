export default async function get_puzzle_id(req, res) {
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
        res.status(200).json({ puzzleId: puzzleId });
    } catch (error) {
        res.status(500).json({ message: 'It no work', error: error.message });
    }
}
