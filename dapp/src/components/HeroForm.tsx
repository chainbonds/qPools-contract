import {useState} from "react";
import StakeForm from "./StakeForm";
import {Typography} from "@material-ui/core";

enum HeroFormState {
    Stake,
    Unstake
};

export default function HeroForm(props: any) {

    const [displayForm, setDisplayForm] = useState<HeroFormState>(HeroFormState.Stake);

    const stakeTab = () => {
        if (displayForm == HeroFormState.Stake) {
            return (
                <button onClick={() => changeTabToStake(HeroFormState.Stake)} className="bg-pink-600 inline-block rounded-t pb-4 py-2 px-4 text-white font-semibold">
                    Stake
                </button>
            );
        } else {
            return (
                <button onClick={() => changeTabToStake(HeroFormState.Stake)} className="bg-pink-900 inline-block rounded-t pb-4 py-2 px-4 text-white hover:text-gray-200 font-semibold">
                    Stake
                </button>
            );
        }
    };

    const unstakeTab = () => {
        if (displayForm == HeroFormState.Unstake) {
            return (
                <button onClick={() => changeTabToStake(HeroFormState.Unstake)} className="bg-pink-600 inline-block rounded-t pb-4 py-2 px-4 text-white font-semibold">
                    Unstake
                </button>
            );
        } else {
            return (
                <button onClick={() => changeTabToStake(HeroFormState.Unstake)} className="bg-pink-900 inline-block rounded-t pb-4 py-2 px-4 text-white hover:text-gray-200 font-semibold">
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
                <ul className="flex">
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

            Please select your wallet to connect
            You have 0 Chain-Bond Tokens, worth currently worth 0.0 SOL.
            {/* Perhaps calculat initially paid-in amount, also to calculate profits (?) */}

            <br />

            <div className={"min-h-full -mb-2"}>
                { stakingFormNavbar() }
            </div>
            <StakeForm />
        </>
    )

}