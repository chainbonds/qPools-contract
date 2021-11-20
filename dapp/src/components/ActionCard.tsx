import React from "react";
import {useEffect, useState} from "react";
import axios from "axios";
import {Bond} from "../types/bond";
import VariableStakeForm from "./VariableStakeForm";
import ListPools from "./ListPools";

const ActionCard = (props: any) => {

    return (
        <>
            <div className="mt-10 sm:mt-0">
                <div className="md:grid md:grid-cols-2 md:gap-6">
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        {!props.showStake && <VariableStakeForm />}
                        {props.showStake && <ListPools />}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ActionCard;