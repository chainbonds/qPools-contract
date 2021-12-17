import {useState} from "react";
import StakeForm from "./swap/StakeForm";

enum HeroFormState {
    Stake,
    Unstake
};

export default function HeroForm(props: any) {

    const [displayForm, setDisplayForm] = useState<HeroFormState>(HeroFormState.Stake);

    const stakeTab = () => {
        if (displayForm == HeroFormState.Stake) {
            return (
                <button onClick={() => changeTabToStake(HeroFormState.Stake)} className="bg-slate-800 w-20 border-b-2 border-white inline-block rounded-t pb-4 py-2 px-4 text-white">
                    Stake
                </button>
            );
        } else {
            return (
                <button onClick={() => changeTabToStake(HeroFormState.Stake)} className="bg-slate-800 inline-block pb-2 rounded-t pb-4 py-2 px-4 text-white hover:text-gray-200">
                    Stake
                </button>
            );
        }
    };

    const unstakeTab = () => {
        if (displayForm == HeroFormState.Unstake) {
            return (
                <button onClick={() => changeTabToStake(HeroFormState.Unstake)} className="bg-slate-800 w-20 border-b-2 border-white inline-block rounded-t pb-4 py-2 px-4 text-white">
                    Unstake
                </button>
            );
        } else {
            return (
                <button onClick={() => changeTabToStake(HeroFormState.Unstake)} className="bg-slate-800 inline-block pb-2 rounded-t pb-4 py-2 px-4 text-white hover:text-gray-200">
                    Unstake
                </button>
            );
        }

    }

    const changeTabToStake = (x: HeroFormState) => {
        setDisplayForm((_: HeroFormState) => x);
    };


    const stakingFormNavbar = () => {
        return (
            <>
                <ul className="flex mx-auto px-auto content-center items-center place-content-center">
                    <li className="-mb-px mr-3">
                        {stakeTab()}
                    </li>
                    <li className="mr-5">
                        {unstakeTab()}
                    </li>
                </ul>
            </>
        )
    }

    return (
        <>

            {/*Please select your wallet to connect*/}
            {/*You have 0 Chain-Bond Tokens, worth currently worth 0.0 SOL.*/}
            {/* Perhaps calculat initially paid-in amount, also to calculate profits (?) */}

            <br />

            <div className={"min-h-full mx-auto px-auto content-center items-center place-content-center"}>
                { stakingFormNavbar() }
            </div>
            <StakeForm />
        </>
    )

}