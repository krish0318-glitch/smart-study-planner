const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const allowedPriorities = ["Low", "Medium", "High"];

router.get("/", auth, async (req, res) => {
  try { res.json(await Task.find({ userId: req.user.id }).sort({ completed: 1, dueDate: 1, createdAt: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.post("/add", auth, async (req, res) => {
  try {
    const { title, subject, description, priority, dueDate, estimatedTime } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: "Task title is required" });
    const task = await Task.create({
      title: title.trim(), subject: subject?.trim() || "General", description: description?.trim() || "",
      priority: allowedPriorities.includes(priority) ? priority : "Medium", dueDate: dueDate || undefined,
      estimatedTime: Number(estimatedTime) || 60, userId: req.user.id
    });
    res.status(201).json({ message: "Task added", task });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid task id" });
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found" });
    const { title, subject, description, priority, dueDate, estimatedTime, completed } = req.body;
    if (title !== undefined) task.title = title.trim();
    if (subject !== undefined) task.subject = subject.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority && allowedPriorities.includes(priority)) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (estimatedTime !== undefined) task.estimatedTime = Number(estimatedTime) || 0;
    if (completed !== undefined) task.completed = Boolean(completed);
    task.status = task.completed ? "Completed" : "Pending";
    await task.save();
    res.json(task);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const result = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get("/stats/summary", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });
    const completed = tasks.filter(t => t.completed).length;
    const subjectMap = {};
    tasks.forEach(t => {
      const key = t.subject || "General";
      if (!subjectMap[key]) subjectMap[key] = { total: 0, completed: 0, minutes: 0 };
      subjectMap[key].total += 1; subjectMap[key].completed += t.completed ? 1 : 0; subjectMap[key].minutes += Number(t.estimatedTime) || 0;
    });
    res.json({ total: tasks.length, completed, pending: tasks.length - completed, completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0, totalMinutes: tasks.reduce((s, t) => s + (Number(t.estimatedTime) || 0), 0), subjects: Object.entries(subjectMap).map(([subject, v]) => ({ subject, ...v, progress: v.total ? Math.round(v.completed / v.total * 100) : 0 })) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
