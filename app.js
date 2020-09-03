const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname + '/date.js');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.listen(process.env.PORT || 3000, function () {
	console.log('Server started on port 3000');
});

// creating new bd
mongoose.connect(
	'mongodb+srv://liberty_21:yrt4NKpvbJqRzlah@nodetrainings.bs1tk.mongodb.net/toDoList?retryWrites=true&w=majority',
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}
);

// create a db schema
const itemSchema = new mongoose.Schema({
	name: { type: String, required: [true, 'Name of the fruit is required!'] },
});

// create a Model/Collection in the db
const Item = mongoose.model('Item', itemSchema);

// create one new Document in Collection
const item1 = new Item({ name: 'Welcome to your to do list app' });

const item2 = new Item({ name: 'Hit the + button to add an item' });

const item3 = new Item({ name: '<-- Hit this to delete an item' });

const defaultItems = [item1, item2, item3];

app.get('/', function (req, res) {
	const listName = req.body.list;
	Item.find({}, function (err, foundItems) {
		if (foundItems.length === 0) {
			// Insert all items(documents) into our Collection
			Item.insertMany(defaultItems, function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log('Successfully saved all the items into todolistDB');
				}
			});
			res.redirect('/');
		} else {
			res.render('list', {
				today: date.getDate(),
				listTitle: 'Today',
				newListItems: foundItems,
			});
		}
	});
});

app.post('/', function (req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;
	const newItem = new Item({
		name: itemName,
	});

	if (listName === 'Today') {
		newItem.save();
		res.redirect('/');
	} else {
		List.findOne({ name: listName }, function (err, foundList) {
			foundList.items.push(newItem);
			foundList.save();
			res.redirect('/' + listName);
		});
	}
});

app.post('/delete', (req, res) => {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === 'Today') {
		Item.findByIdAndRemove(checkedItemId, function (err) {
			if (err) {
				console.log(err);
			} else {
				res.redirect('/');
			}
		});
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkedItemId } } },
			function (err, foundList) {
				if (!err) {
					res.redirect('/' + listName);
				}
			}
		);
	}
});

// Another list with another db schema & model

const listSchema = {
	name: String,
	items: [itemSchema],
};

const List = mongoose.model('List', listSchema);

app.get('/:customListName', function (req, res) {
	const customListName = _.lowerCase(req.params.customListName);
	List.findOne({ name: customListName }, (err, foundList) => {
		if (!err) {
			if (!foundList) {
				// Create a new list
				const list = new List({
					name: customListName,
					items: defaultItems,
				});
				list.save();
				res.redirect('/' + customListName);
			} else {
				// Show existing list
				res.render('list', {
					today: date.getDate(),
					listTitle: foundList.name,
					newListItems: foundList.items,
				});
			}
		}
	});
});

app.get('/about', function (req, res) {
	res.render('about');
});
