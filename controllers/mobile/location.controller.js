import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';

const getAllLocationHierarchy = asyncHandler(async (req, res) => {
    const countries = await models.Country.find({ status: true });

    const result = await Promise.all(
        countries.map(async (country) => {
            const states = await models.State.find({ country_name: country.name, status: true });

            const populatedStates = await Promise.all(
                states.map(async (state) => {
                    const cities = await models.City.find({ state_name: state.name, status: true });

                    const populatedCities = await Promise.all(
                        cities.map(async (city) => {
                            const chapters = await models.Chapter.find({ city_name: city.name, status: true });

                            return {
                                name: city.name,
                                chapters: chapters.map(chapter => ({ name: chapter.name }))
                            };
                        })
                    );

                    return {
                        name: state.name,
                        cities: populatedCities
                    };
                })
            );

            return {
                name: country.name,
                states: populatedStates
            };
        })
    );

    return res.status(200).json({ success: true, data: result });
})

export const locationController = {
    getAllLocationHierarchy
}