const { ApolloServer, gql, PubSub, withFilter } = require('apollo-server');
const pubsub = new PubSub();

const typeDefs = gql`
	type Post {
		message: String!
		date: String!
	}

	type Channel {
		name: String!
		posts: [Post!]!
	}

	type Query {
		posts(channelId: Int!): [Post!]!
	}

	type Mutation {
		addPost(channelId: Int! message: String!): Post!
		addChannel(channelName: String!): Int!
	}

	type Subscription {
		newPost(channelId: Int!): Post!
		newChannel: Channel!
	}
`

const resolvers = {
	Query: {
		posts: (_, {channelId}) => {
			return data[parseInt(channelId)].posts;
        },
        // user(parent, args, context, info) {
		// 	return users.find(user => user.id === args.id);
		// }
	},
	Mutation: {
		addPost: (_, {channelId, message }) => {
			const post = { message, date: new Date() }
			data[channelId]['posts'].push(post)
			pubsub.publish(`NEW_POST`, { channelId: channelId, newPost: post }) // Publish!
			return post
		},
		addChannel: (_, {channelName}) => {
			const channel = {name: channelName, posts: []}
			data.push(channel)
			let channelId = data.length - 1
			pubsub.publish(`NEW_CHANNEL`, {channelId: channelId, newChannel: channel})
			return channelId
		}
	},
	Subscription: {
		newPost:  {
			subscribe: withFilter(
				() => pubsub.asyncIterator(`NEW_POST`),
				(payload, variables) => {
					return (payload.channelId === variables.channelId)
				},
			)
		},
		newChannel: {
			subscribe: () => pubsub.asyncIterator(`NEW_CHANNEL`)
		}
	}
}
const data = [
	{ name: 'Cars', posts: [{message: 'Lamborghinis are cool', date: new Date()}] },
	{ name: 'Bikes', posts: [{message: 'Ducattis are cool', date: new Date()}] },
]

const server = new ApolloServer({ 
	typeDefs, 
	resolvers 
});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
	console.log(`🚀 Server ready at ${url}`);
});