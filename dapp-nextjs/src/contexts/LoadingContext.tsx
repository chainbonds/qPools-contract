import React, {useState, useContext, useEffect} from 'react';

export interface ILoad {
    loading: any,
    increaseCounter: any,
    decreaseCounter: any
}

const defaultValue: ILoad = {
    loading: () => console.error("attempting to use AuthContext outside of a valid provider"),
    // currentToken: () => console.error("attempting to use AuthContext outside of a valid provider"),
    increaseCounter: () => console.error("attempting to use AuthContext outside of a valid provider"),
    decreaseCounter: () => console.error("attempting to use AuthContext outside of a valid provider"),
}

const LoadContext = React.createContext<ILoad>(defaultValue);

export function useLoad() {
    return useContext(LoadContext);
}

export function LoadProvider(props: any) {

    const [loading, setLoading] = useState<boolean>(false);
    const [loadCounter, setLoadCounter] = useState<number>(0);
    // Use counter logic if the current logic seems to fail
    // const [loadingCounter, setLoadingCounter] = useState<number>(0);

    useEffect(() => {
        if (loadCounter < 0) {
            alert("Load Counter is below zero!");
        }
        console.log("Loading is: ", loadCounter > 0);
        setLoading(() => {
            // return true;
            return loadCounter > 0;
        });
    }, [loadCounter]);

    const increaseCounter = () => {
        setLoadCounter((loadCounter: number) => loadCounter + 1);
    };

    const decreaseCounter = () => {
        setLoadCounter((loadCounter: number) => loadCounter - 1);
    }

    const value: ILoad = {
        loading,
        increaseCounter,
        decreaseCounter
    };

    return (
        <>
            <LoadContext.Provider value={value}>
                {props.children}
            </LoadContext.Provider>
        </>
    );
}