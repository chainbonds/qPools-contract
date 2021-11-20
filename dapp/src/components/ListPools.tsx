import React from "react";
import {useEffect, useState} from "react";
import axios from "axios";
import {Bond} from "../types/bond";

const ListPools = (props: any) => {

    // Make the RPC call here.
    // I hope phantom supports this way of making submissions ...
    const [bondList, setBondList] = useState<Bond[]>([]);

    // const handleDecisionChange = (_selectedOption: ReactSelectType) => {
    //     console.log("Handling decision to :", _selectedOption);
    //     setSelectedOption(prev => _selectedOption);
    // };

    const getBondList = async () => {
        let request_body = {};

        try {
            let bondListDBResponse = await axios({
                method: 'get',
                url: 'http://127.0.0.1:5000/api/bond',
                data: request_body
            });
            console.log("Response from getting bonds in pool in the database is: ", bondListDBResponse);

            // Save this into the ImoList
            setBondList((_: any) => {
                return bondListDBResponse.data;
            });

        } catch (error) {
            console.log("Error making request");
            console.log(JSON.stringify(error));
        }
    }

    useEffect(() => {
        getBondList();
    }, []);

    return (
        <>
            <div className="shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 bg-white sm:p-6">
                    <div className="grid grid-cols-6 gap-6">
                        <div className="-m-2 text-center">
                                {
                                    bondList.map((bondItem: Bond) => {
                                        return (
                                            <div className="p-2">
                                                <div
                                                    className="inline-flex items-center bg-white leading-none text-indigo-600 rounded-full p-2 shadow text-teal text-sm">
                                                    <span
                                                        className="inline-flex bg-indigo-300 text- rounded-full h-6 px-3 justify-center items-center">
                                                        Bond Pool Addresss
                                                    </span>
                                                    <span className="inline-flex px-2">
                                                        {bondItem.bondAccount}
                                                    </span>
                                                    <span
                                                        className="inline-flex bg-indigo-600 text-white rounded-full h-6 px-3 justify-center items-center">
                                                        Redeem Bond
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ListPools;