const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Building = mongoose.model("Building");
const requireToken = require("../../middleware/requireToken");
const isSuperAdminOrAdmin = require("../../middleware/isSuperAdminOrAdmin");

const router = express.Router();

router.use(requireToken);

/*
@type     -   GET
@route    -   /building/:buildingId/amenities/search
@desc     -   Endpoint to get all the list of amenities
@access   -   private (to admins and end users)
*/
router.get("/:buildingId/amenities/search", async (req, res) => {
  try {
    const buildingId = req.params.buildingId;
    const buildings = await Building.findById(buildingId);
    const amenities = buildings.amenities;
    res.status(200).send({ amenities });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /building/:buildingId/amenities/search/:id
@desc     -   Endpoint to get one amenity details
@access   -   private (to admins and end users)
*/
router.get("/:buildingId/amenities/search/:amenityId", async (req, res) => {
  try {
    const buildingId = req.params.buildingId;
    const amenityId = req.params.amenityId;
    const building = await Building.findOne(
      { _id: buildingId, "amenities._id": amenityId },
      { "amenities.$": 1 }
    );
    res.status(200).send({ building });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   PUT
@route    -   /building/:buildingId/amenities/create
@desc     -   Endpoint to create the building
@access   -   private (only accessible to admins/superadmins)
*/
router.put("/:buildingId/amenities/create", async (req, res) => {
  const buildingId = req.params.buildingId;
  const amenitiesInfo = ({ name, desription, isActive } = req.body);
  const lastUpdatedBy = {
    _id: req.user._id,
    name: `${req.user.firstName} ${req.user.lastName}`,
    timestamp: new Date(),
  };

  try {
    await Building.updateOne(
      { _id: buildingId },
      { $push: { amenities: amenitiesInfo }, lastUpdatedBy }
    );
    res.status(200).send({ message: "Amenities added successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   PUT
@route    -   /building/:buildingId/amenities/update/:id
@desc     -   Endpoint to create the building
@access   -   private (only accessible to admins/superadmins)
*/
router.put("/:buildingId/amenities/update/:amenityId", async (req, res) => {
  const buildingId = req.params.buildingId;
  const amenityId = req.params.amenityId;
  const updatedAmenity = ({ name, desription, isActive } = req.body);
  const lastUpdatedBy = {
    _id: req.user._id,
    name: `${req.user.firstName} ${req.user.lastName}`,
    timestamp: new Date(),
  };

  try {
    await Building.updateOne(
      { _id: buildingId, "amenities._id": amenityId },
      { $set: { "amenities.$": updatedAmenity }, lastUpdatedBy }
    );
    res.status(200).send({ message: "Amenities updated successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
