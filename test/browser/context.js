import { h, render, Component } from '../../build/zreact';
/** @jsx h */

const CHILDREN_MATCHER = sinon.match( v => v==null || Array.isArray(v) && !v.length , '[empty children]');

describe('context', () => {
	let scratch;

	before( () => {
		scratch = document.createElement('div');
		(document.body || document.documentElement).appendChild(scratch);
	});

	beforeEach( () => {
		scratch.innerHTML = '';
	});

	after( () => {
		scratch.parentNode.removeChild(scratch);
		scratch = null;
	});

	it('should pass context to grandchildren', () => {
		const CONTEXT = { a:'a' };
		const PROPS = { b:'b' };
		// let inner;

		class Outer extends Component {
			getChildContext() {
				return CONTEXT;
			}
			render(props) {
				return <div><Inner {...props} /></div>;
			}
		}
		sinon.spy(Outer.prototype, 'getChildContext');

		class Inner extends Component {
			// constructor() {
			// 	super();
			// 	inner = this;
			// }
			shouldComponentUpdate() { return true; }
			componentWillReceiveProps() {}
			componentWillUpdate() {}
			componentDidUpdate() {}
			render(props, state, context) {
				return <div>{ context && context.a }</div>;
			}
		}
		sinon.spy(Inner.prototype, 'shouldComponentUpdate');
		sinon.spy(Inner.prototype, 'componentWillReceiveProps');
		sinon.spy(Inner.prototype, 'componentWillUpdate');
		sinon.spy(Inner.prototype, 'componentDidUpdate');
		sinon.spy(Inner.prototype, 'render');

		render(<Outer />, scratch, scratch.lastChild);

		expect(Outer.prototype.getChildContext).to.have.been.calledOnce;

		// initial render does not invoke anything but render():
		expect(Inner.prototype.render).to.have.been.calledWith({ children:CHILDREN_MATCHER }, {}, CONTEXT);

		CONTEXT.foo = 'bar';
		render(<Outer {...PROPS} />, scratch, scratch.lastChild);

		expect(Outer.prototype.getChildContext).to.have.been.calledTwice;

		let props = { children: CHILDREN_MATCHER, ...PROPS };
		expect(Inner.prototype.shouldComponentUpdate).to.have.been.calledOnce.and.calledWith(props, {}, CONTEXT);
		expect(Inner.prototype.componentWillReceiveProps).to.have.been.calledWith(props, CONTEXT);
		expect(Inner.prototype.componentWillUpdate).to.have.been.calledWith(props, {});
		expect(Inner.prototype.componentDidUpdate).to.have.been.calledWith({ children:CHILDREN_MATCHER }, {});
		expect(Inner.prototype.render).to.have.been.calledWith(props, {}, CONTEXT);


		/* Future:
		 *  Newly created context objects are *not* currently cloned.
		 *  This test checks that they *are* cloned.
		 */
		// Inner.prototype.render.reset();
		// CONTEXT.foo = 'baz';
		// inner.forceUpdate();
		// expect(Inner.prototype.render).to.have.been.calledWith(PROPS, {}, { a:'a', foo:'bar' });
	});

	it('should pass context to direct children', () => {
		const CONTEXT = { a:'a' };
		const PROPS = { b:'b' };

		class Outer extends Component {
			getChildContext() {
				return CONTEXT;
			}
			render(props) {
				return <Inner {...props} />;
			}
		}
		sinon.spy(Outer.prototype, 'getChildContext');

		class Inner extends Component {
			shouldComponentUpdate() { return true; }
			componentWillReceiveProps() {}
			componentWillUpdate() {}
			componentDidUpdate() {}
			render(props, state, context) {
				return <div>{ context && context.a }</div>;
			}
		}
		sinon.spy(Inner.prototype, 'shouldComponentUpdate');
		sinon.spy(Inner.prototype, 'componentWillReceiveProps');
		sinon.spy(Inner.prototype, 'componentWillUpdate');
		sinon.spy(Inner.prototype, 'componentDidUpdate');
		sinon.spy(Inner.prototype, 'render');

		render(<Outer />, scratch, scratch.lastChild);

		expect(Outer.prototype.getChildContext).to.have.been.calledOnce;

		// initial render does not invoke anything but render():
		expect(Inner.prototype.render).to.have.been.calledWith({ children: CHILDREN_MATCHER }, {}, CONTEXT);

		CONTEXT.foo = 'bar';
		render(<Outer {...PROPS} />, scratch, scratch.lastChild);

		expect(Outer.prototype.getChildContext).to.have.been.calledTwice;

		let props = { children: CHILDREN_MATCHER, ...PROPS };
		expect(Inner.prototype.shouldComponentUpdate).to.have.been.calledOnce.and.calledWith(props, {}, CONTEXT);
		expect(Inner.prototype.componentWillReceiveProps).to.have.been.calledWith(props, CONTEXT);
		expect(Inner.prototype.componentWillUpdate).to.have.been.calledWith(props, {});
		expect(Inner.prototype.componentDidUpdate).to.have.been.calledWith({ children: CHILDREN_MATCHER }, {});
		expect(Inner.prototype.render).to.have.been.calledWith(props, {}, CONTEXT);

		// make sure render() could make use of context.a
		expect(Inner.prototype.render).to.have.returned(sinon.match({ children:['a'] }));
	});

	it('should preserve existing context properties when creating child contexts', () => {
		let outerContext = { outer:true },
			innerContext = { inner:true };
		class Outer extends Component {
			getChildContext() {
				return { outerContext };
			}
			render() {
				return <div><Inner /></div>;
			}
		}

		class Inner extends Component {
			getChildContext() {
				return { innerContext };
			}
			render(props, state, context) {
                expect(props.children).to.be.empty
                expect(state).to.deep.equal({});
                expect(context).to.deep.equal({ outerContext });
				return <InnerMost />;
			}
		}

		class InnerMost extends Component {
			render(props, state, context) {
                expect(props.children).to.be.empty
                expect(state).to.deep.equal({});
                expect(context).to.deep.equal({ outerContext, innerContext });
				return <strong>test</strong>;
			}
		}

		sinon.spy(Inner.prototype, 'render');
		sinon.spy(InnerMost.prototype, 'render');

		render(<Outer />, scratch);

		// expect(Inner.prototype.render).to.have.been.calledWith({ children: CHILDREN_MATCHER }, {}, { outerContext });
		// expect(InnerMost.prototype.render).to.have.been.calledWith({ children: CHILDREN_MATCHER }, {}, { outerContext, innerContext });
	});
});
