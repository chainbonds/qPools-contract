/* This example requires Tailwind CSS v2.0+ */

import {useEffect, useState} from "react";

export default function VariableStakeForm() {

    // TODO: Implement Solana input field
    const [timeInSeconds, setTimeInSeconds] = useState(0.);

    useEffect(() => {

    }, []);

    return (
        <>

            <div className="mt-10 sm:mt-0">
                <div className="md:grid md:grid-cols-2 md:gap-6">
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        <form action="#" method="POST">
                            <div className="shadow overflow-hidden sm:rounded-md">
                                <div className="px-4 py-5 bg-white sm:p-6">
                                    <div className="grid grid-cols-6 gap-6">

                                        <div className="col-span-6 sm:col-span-6">
                                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                                                Amount
                                            </label>
                                            <input
                                                type="number"
                                                name="amount"
                                                id="amount"
                                                autoComplete="amount"
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>

                                        {/*<div className="col-span-6 sm:col-span-3">*/}
                                        {/*    <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">*/}
                                        {/*        Last name*/}
                                        {/*    </label>*/}
                                        {/*    <input*/}
                                        {/*        type="text"*/}
                                        {/*        name="last-name"*/}
                                        {/*        id="last-name"*/}
                                        {/*        autoComplete="family-name"*/}
                                        {/*        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"*/}
                                        {/*    />*/}
                                        {/*</div>*/}

                                        <div className="col-span-6 sm:col-span-6">
                                            <label htmlFor="epochs" className="block text-sm font-medium text-gray-700">
                                                Time (in Epochs*)
                                            </label>
                                            <input
                                                type="number"
                                                name="epochs"
                                                id="epochs"
                                                autoComplete="epochs"
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>

                                        <div className="col-span-6 sm:col-span-6">
                                            <label htmlFor="compounding_boolean" className="block text-sm font-medium text-gray-700">
                                                Monthly Payout
                                            </label>
                                            <select
                                                id="country"
                                                name="country"
                                                autoComplete="country-name"
                                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            >
                                                <option>
                                                    Pay me Monthly
                                                </option>
                                                <option>
                                                    Don't pay me Monthly (Compound Interest)
                                                </option>
                                            </select>
                                        </div>

                                        {/*<div className="col-span-6">*/}
                                        {/*    <label htmlFor="street-address" className="block text-sm font-medium text-gray-700">*/}
                                        {/*        Street address*/}
                                        {/*    </label>*/}
                                        {/*    <input*/}
                                        {/*        type="text"*/}
                                        {/*        name="street-address"*/}
                                        {/*        id="street-address"*/}
                                        {/*        autoComplete="street-address"*/}
                                        {/*        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"*/}
                                        {/*    />*/}
                                        {/*</div>*/}

                                        {/*<div className="col-span-6 sm:col-span-6 lg:col-span-2">*/}
                                        {/*    <label htmlFor="city" className="block text-sm font-medium text-gray-700">*/}
                                        {/*        City*/}
                                        {/*    </label>*/}
                                        {/*    <input*/}
                                        {/*        type="text"*/}
                                        {/*        name="city"*/}
                                        {/*        id="city"*/}
                                        {/*        autoComplete="address-level2"*/}
                                        {/*        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"*/}
                                        {/*    />*/}
                                        {/*</div>*/}

                                        {/*<div className="col-span-6 sm:col-span-3 lg:col-span-2">*/}
                                        {/*    <label htmlFor="region" className="block text-sm font-medium text-gray-700">*/}
                                        {/*        State / Province*/}
                                        {/*    </label>*/}
                                        {/*    <input*/}
                                        {/*        type="text"*/}
                                        {/*        name="region"*/}
                                        {/*        id="region"*/}
                                        {/*        autoComplete="address-level1"*/}
                                        {/*        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"*/}
                                        {/*    />*/}
                                        {/*</div>*/}

                                        {/*<div className="col-span-6 sm:col-span-3 lg:col-span-2">*/}
                                        {/*    <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700">*/}
                                        {/*        ZIP / Postal code*/}
                                        {/*    </label>*/}
                                        {/*    <input*/}
                                        {/*        type="text"*/}
                                        {/*        name="postal-code"*/}
                                        {/*        id="postal-code"*/}
                                        {/*        autoComplete="postal-code"*/}
                                        {/*        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"*/}
                                        {/*    />*/}
                                        {/*</div>*/}

                                    </div>
                                </div>
                                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </>
    );
}
