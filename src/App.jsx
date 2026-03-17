import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
    const DEFAULT_REPS = 5;
    const DEFAULT_SETS = 5;
    const DEFAULT_WEIGHT = 50;
    const DEFAULT_REST = 120;
    const DEFUALT_ONE_REP_MAX = 70;

    const PRESETS = [
        { sets: 6, reps: 6, weight: 0.70 },
        { sets: 7, reps: 5, weight: 0.75 },
        { sets: 8, reps: 4, weight: 0.80 },
        { sets: 10, reps: 3, weight: 0.85 },
    ];

    const [oneRepMax, setOneRepMax] = useState(0)

    const [modalShown, setModalShown] = useState(0)

    const [sets, setSets] = useState(6)
    const [reps, setReps] = useState(6)
    const [weight, setWeight] = useState(50)
    const [rest, setRest] = useState(120)

    const [workout, setWorkout] = useState([])

    const [restSet, setRestSet] = useState()
    const [restSecondsLeft, setRestSecondsLeft] = useState(0);
    const restTimeEndRef = useRef(null);

    function initWorkout(sets, reps, weight, rest) {
        const tempWorkout = [];
        for (let i = 0; i < sets; i++) {
            tempWorkout.push({
                reps: reps,
                weight: weight,
                actualReps: null,
                actualWeight: null,
                complete: false,
                restComplete: false,
            });
        }
        setWorkout(tempWorkout)
    }

    function handleSetsChange(e) {
        const inputSets = e.target.value;
        setSets(inputSets);
        localStorage.setItem("sets", e.target.value);
    }

    function handleRepsChange(e) {
        const inputReps = e.target.value;
        setReps(inputReps);
        localStorage.setItem("reps", e.target.value);
    }

    function handleWeightChange(e) {
        const inputWeight = e.target.value;
        setWeight(inputWeight);
        localStorage.setItem("weight", e.target.value);
    }

    function handleRestChange(e) {
        const inputRest = e.target.value;
        setRest(inputRest);
        localStorage.setItem("rest", e.target.value);
    }

    function handleOneRepMaxChange(e) {
        const inputOneRepMax = e.target.value;
        setOneRepMax(inputOneRepMax);
        localStorage.setItem("oneRepMax", e.target.value);
    }

    function handleModalConfigOpen() {
        setModalShown("config")
    }

    function handleModalCompleteOpen() {
        setModalShown("complete")
    }

    function handleModalPresetOpen() {
        setModalShown("preset")
    }

    function handleModalClose() {
        setModalShown(0)
    }

    function handleSetComplete(setNo) {
        setWorkout(prev => {
            const workoutCopy = [...prev];
            const isSetComplete = workoutCopy[setNo]["complete"];

            workoutCopy[setNo] = {
                ...workoutCopy[setNo],
                complete: !isSetComplete
            };
            if (workoutCopy[setNo]["actualWeight"] == null) {
                workoutCopy[setNo]["actualWeight"] = workoutCopy[setNo]["weight"]
            }
            if (workoutCopy[setNo]["actualReps"] == null) {
                workoutCopy[setNo]["actualReps"] = workoutCopy[setNo]["reps"]
            }
            if (!isSetComplete) {
                startRestTime(setNo)
            } else {
                setRestSet(null)
                workoutCopy[setNo]["restComplete"] = false;
            }
            return workoutCopy;
        });
    }

    function handleActualWeightChange(e, setNo) {
        setWorkout(prev => {
            const workoutCopy = [...prev];
            workoutCopy[setNo] = {
                ...workoutCopy[setNo],
                actualWeight: e.target.value
            };
            return workoutCopy;
        });
    }

    function handleActualRepsChange(e, setNo) {
        setWorkout(prev => {
            const workoutCopy = [...prev];
            workoutCopy[setNo] = {
                ...workoutCopy[setNo],
                actualReps: e.target.value
            };
            return workoutCopy;
        });
    }

    function startRestTime(setNo) {
        setRestSecondsLeft(rest)
        setRestSet(setNo)
    }

    function endRestTime(setNo) {
        setRestSet(null)
        setWorkout(prev => {
            const workoutCopy = [...prev];
            workoutCopy[setNo] = {
                ...workoutCopy[setNo],
                restComplete: true
            };
            return workoutCopy;
        });
        isWorkoutComplete();
    }

    function isWorkoutComplete() {
        var isComplete = true;
        workout.forEach(w => {
            if (!w.complete) {
                isComplete = false;
            }
        })
        if (isComplete) {
            handleModalCompleteOpen()
        }
    }

    useEffect(() => {
        if (restSecondsLeft == null || restSecondsLeft <= 0) return;

        restTimeEndRef.current = Date.now() + restSecondsLeft * 1000;

        let frameId;

        const tick = () => {
            const now = Date.now();
            const remaining = Math.max(Math.round((restTimeEndRef.current - now) / 1000), 0);
            setRestSecondsLeft(remaining);

            if (remaining > 0) {
                frameId = requestAnimationFrame(tick);
            } else {
                endRestTime(restSet);
            }
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [restSecondsLeft]);


    function parseSecsToMMSS(secs) {
        const minutes = Math.floor(secs / 60);
        const seconds = secs % 60;

        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    function handlePresetClick(dayIndex, weekIndex) {
        const weight = Math.round((PRESETS[dayIndex].weight * oneRepMax + (5 * weekIndex)) / 2.5) * 2.5;
        initWorkout(PRESETS[dayIndex].sets, PRESETS[dayIndex].reps, weight, rest)
        setSets(PRESETS[dayIndex].sets);
        setReps(PRESETS[dayIndex].reps);
        setWeight(weight);
        localStorage.setItem("sets", PRESETS[dayIndex].sets);
        localStorage.setItem("reps", PRESETS[dayIndex].reps);
        localStorage.setItem("weight", weight);
        handleModalClose()
    }

    useEffect(() => {
        initWorkout(sets, reps, weight, rest);
    }, [sets, weight, reps, rest]);

    useEffect(() => {
        setSets(localStorage.getItem("sets") ?? DEFAULT_SETS);
        setReps(localStorage.getItem("reps") ?? DEFAULT_REPS);
        setWeight(localStorage.getItem("weight") ?? DEFAULT_WEIGHT);
        setRest(localStorage.getItem("rest") ?? DEFAULT_REST);
        setOneRepMax(localStorage.getItem("oneRepMax") ?? DEFUALT_ONE_REP_MAX);
    }, []);

    return (
        <>
            <div className={"modal " + (modalShown ? 'show' : 'hidden')}>
                <div className={"modal-modal " + (modalShown == "config" ? 'show' : 'hidden')}>
                    <button onClick={handleModalClose}>Close</button>
                    <div className="modal-row">
                        <label>Sets:</label>
                        <select name="sets" onChange={handleSetsChange} value={sets}>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                            <option value="11">11</option>
                            <option value="12">12</option>
                        </select>
                    </div>
                    <div className="modal-row">
                        <label>Reps:</label>
                        <select name="reps" onChange={handleRepsChange} value={reps}>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                            <option value="11">11</option>
                            <option value="12">12</option>
                        </select>
                    </div>
                    <div className="modal-row">
                        <label>Weight: </label>
                        <input type="number" value={weight} onChange={handleWeightChange} />
                    </div>
                    <div className="modal-row">
                        <label>Rest: </label>
                        <input type="number" value={rest} onChange={handleRestChange} />
                    </div>
                </div>
                <div className={"modal-modal " + (modalShown == "preset" ? 'show' : 'hidden')}>
                    <button onClick={handleModalClose}>Close</button>
                    <div className="modal-row">
                        <label>One Rep Max</label>
                        <input type="number" value={oneRepMax} onChange={handleOneRepMaxChange} />
                    </div>
                    {PRESETS.map((preset, dayIndex) => (
                        <div className="modal-row" key={dayIndex}>
                            <label>Day {dayIndex + 1} ({preset.sets} x {preset.reps})</label>
                            <button onClick={() => { handlePresetClick(dayIndex, 0) }}>Week 1</button>
                            <button onClick={() => { handlePresetClick(dayIndex, 1) }}>Week 2</button>
                            <button onClick={() => { handlePresetClick(dayIndex, 2) }}>Week 3</button>
                        </div>
                    ))}
                </div>
                <div className={"modal-modal " + (modalShown == "complete" ? 'show' : 'hidden')}>
                    <h1>Workout Complete</h1>
                    <button onClick={handleModalClose}>Close</button>
                </div>
            </div>
            <div className="header">
                <div className="title">Workout</div>
                <div className="actions">
                    <button onClick={handleModalPresetOpen}>Preset</button>
                    <button onClick={handleModalConfigOpen}>Edit</button>
                </div>
            </div>
            {
                workout.map((_, i) => (
                    <div key={i} className="exercise-holder">
                        <div className={"exercise " + (workout[i]["complete"] ? "complete" : "")}>
                            <div className="setNo">{i + 1}</div>
                            <div className="weight">
                                <input type="number" value={workout[i]["actualWeight"]} onChange={e => handleActualWeightChange(e, i)} placeholder={workout[i]["weight"]} disabled={(workout[i]["complete"] ? true : false)} />
                            </div>
                            <div className="reps">
                                <input type="number" value={workout[i]["actualReps"]} onChange={e => handleActualRepsChange(e, i)} placeholder={workout[i]["reps"]} disabled={(workout[i]["complete"] ? true : false)} />
                            </div>
                            <div className="action">
                                <button class="ok" onClick={() => handleSetComplete(i)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className={"timer " + (workout[i]["restComplete"] ? "complete" : "")}>
                            <div className="bar"></div>
                            <div className="remaining">
                                {parseSecsToMMSS(restSet === i ? restSecondsLeft : rest)}
                            </div>
                            <div className="bar"></div>
                        </div>
                    </div >
                ))
            }
            <footer></footer>
        </>
    )
}

export default App
