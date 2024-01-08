const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Building = mongoose.model("Building");
const requireToken = require("../../../middleware/requireToken");
const isSuperAdminOrAdmin = require("../../../middleware/isSuperAdminOrAdmin");

const router = express.Router();

router.use(requireToken);

/*
@type     -   GET
@route    -   /building/list
@desc     -   Endpoint to get all the building list
@access   -   private (only accessible to admins/superadmins)
*/
router.get("/building/list", async (req, res) => {
  try {
    const buildings = await Building.find();
    res.status(200).send({ buildings });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /building/search/:id
@desc     -   Endpoint to get one buliding details
@access   -   private (only accessible to admins/superadmins)
*/
router.get("/building/search/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const building = await Building.findById(id);
    res.status(200).send({ building });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   POST
@route    -   /building/create
@desc     -   Endpoint to create the building
@access   -   private (only accessible to admins/superadmins)
*/
router.post("/building/create", isSuperAdminOrAdmin, async (req, res) => {
  const { name, address, numberOfUnits } = req.body;
  const createdBy = {
    _id: req.user._id,
    name: `${req.user.firstName} ${req.user.lastName}`,
    timestamp: new Date(),
  };

  try {
    const building = new Building({
      name,
      address,
      numberOfUnits,
      isActive: true,
      createdBy,
    });
    await building.save();
    res
      .status(200)
      .send({ message: "Building created successfully", building });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   PUT
@route    -   /building/update
@desc     -   Endpoint to update the already existing building details
@access   -   private (only accessible to admins/superadmins)
*/

router.put("/building/update", isSuperAdminOrAdmin, async (req, res) => {
  const buildingId = req.query.id;
  const updateField = ({ name, address, numberOfUnits, isActive } = req.body);
  const lastUpdatedBy = {
    _id: req.user._id,
    name: `${req.user.firstName} ${req.user.lastName}`,
    timestamp: new Date(),
  };

  try {
    if (!JSON.parse(updateField.isActive) && JSON.parse(req.user.isAdmin)) {
      throw new Error("Superadmin access necessary");
    }
    await Building.updateOne(
      { _id: buildingId },
      { $set: updateField, lastUpdatedBy: lastUpdatedBy }
    );
    res.status(200).send({ message: "Building updated successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   PUT
@route    -   /building/assign/:userId/:buildingId
@desc     -   Endpoint to assign the building to existing already existed user account type
@access   -   private (only accessible to admins/superadmins)
*/
router.put(
  "/building/assign/:userId/:buildingId",
  isSuperAdminOrAdmin,
  async (req, res) => {
    const userId = req.params.userId;
    const buildilngId = req.params.buildingId;
    const lastUpdatedBy = {
      _id: req.user._id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      timestamp: new Date(),
    };

    try {
      const user = await User.findById(userId);
      const building = await Building.findById(buildilngId);

      if (!(user || building)) {
        throw new Error("Either budiling or user does not exist.");
      }

      const assignedBuilding = {
        _id: building._id,
        name: building.name,
      };

      await User.updateOne(
        { _id: userId },
        { $push: { building: assignedBuilding }, lastUpdatedBy }
      );

      res
        .status(200)
        .send({ message: `User assigned to building ${building.name}` });
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  }
);

module.exports = router;
