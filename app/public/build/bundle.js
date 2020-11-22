
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.7' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var covidInfections = [
    	{
    		state: "AL",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "AL",
    		county: "Autauga County",
    		avgInfected: 212.83333333333334
    	},
    	{
    		state: "AL",
    		county: "Baldwin County",
    		avgInfected: 661.0833333333334
    	},
    	{
    		state: "AL",
    		county: "Barbour County",
    		avgInfected: 95.41666666666667
    	},
    	{
    		state: "AL",
    		county: "Bibb County",
    		avgInfected: 84.25
    	},
    	{
    		state: "AL",
    		county: "Blount County",
    		avgInfected: 223.58333333333334
    	},
    	{
    		state: "AL",
    		county: "Bullock County",
    		avgInfected: 56.666666666666664
    	},
    	{
    		state: "AL",
    		county: "Butler County",
    		avgInfected: 92.75
    	},
    	{
    		state: "AL",
    		county: "Calhoun County",
    		avgInfected: 484.5
    	},
    	{
    		state: "AL",
    		county: "Chambers County",
    		avgInfected: 136.75
    	},
    	{
    		state: "AL",
    		county: "Cherokee County",
    		avgInfected: 79.66666666666667
    	},
    	{
    		state: "AL",
    		county: "Chilton County",
    		avgInfected: 176.83333333333334
    	},
    	{
    		state: "AL",
    		county: "Choctaw County",
    		avgInfected: 34.25
    	},
    	{
    		state: "AL",
    		county: "Clarke County",
    		avgInfected: 127.5
    	},
    	{
    		state: "AL",
    		county: "Clay County",
    		avgInfected: 72.33333333333333
    	},
    	{
    		state: "AL",
    		county: "Cleburne County",
    		avgInfected: 58
    	},
    	{
    		state: "AL",
    		county: "Coffee County",
    		avgInfected: 187.16666666666666
    	},
    	{
    		state: "AL",
    		county: "Colbert County",
    		avgInfected: 237.25
    	},
    	{
    		state: "AL",
    		county: "Conecuh County",
    		avgInfected: 55.5
    	},
    	{
    		state: "AL",
    		county: "Coosa County",
    		avgInfected: 24.416666666666668
    	},
    	{
    		state: "AL",
    		county: "Covington County",
    		avgInfected: 173.41666666666666
    	},
    	{
    		state: "AL",
    		county: "Crenshaw County",
    		avgInfected: 57.666666666666664
    	},
    	{
    		state: "AL",
    		county: "Cullman County",
    		avgInfected: 328.3333333333333
    	},
    	{
    		state: "AL",
    		county: "Dale County",
    		avgInfected: 185.58333333333334
    	},
    	{
    		state: "AL",
    		county: "Dallas County",
    		avgInfected: 177.83333333333334
    	},
    	{
    		state: "AL",
    		county: "DeKalb County",
    		avgInfected: 369.5833333333333
    	},
    	{
    		state: "AL",
    		county: "Elmore County",
    		avgInfected: 316.4166666666667
    	},
    	{
    		state: "AL",
    		county: "Escambia County",
    		avgInfected: 159.75
    	},
    	{
    		state: "AL",
    		county: "Etowah County",
    		avgInfected: 470.8333333333333
    	},
    	{
    		state: "AL",
    		county: "Fayette County",
    		avgInfected: 65.16666666666667
    	},
    	{
    		state: "AL",
    		county: "Franklin County",
    		avgInfected: 198.33333333333334
    	},
    	{
    		state: "AL",
    		county: "Geneva County",
    		avgInfected: 94.58333333333333
    	},
    	{
    		state: "AL",
    		county: "Greene County",
    		avgInfected: 32.416666666666664
    	},
    	{
    		state: "AL",
    		county: "Hale County",
    		avgInfected: 74.75
    	},
    	{
    		state: "AL",
    		county: "Henry County",
    		avgInfected: 68.58333333333333
    	},
    	{
    		state: "AL",
    		county: "Houston County",
    		avgInfected: 408.9166666666667
    	},
    	{
    		state: "AL",
    		county: "Jackson County",
    		avgInfected: 233.33333333333334
    	},
    	{
    		state: "AL",
    		county: "Jefferson County",
    		avgInfected: 2432.1666666666665
    	},
    	{
    		state: "AL",
    		county: "Lamar County",
    		avgInfected: 50
    	},
    	{
    		state: "AL",
    		county: "Lauderdale County",
    		avgInfected: 298.1666666666667
    	},
    	{
    		state: "AL",
    		county: "Lawrence County",
    		avgInfected: 96
    	},
    	{
    		state: "AL",
    		county: "Lee County",
    		avgInfected: 613.5833333333334
    	},
    	{
    		state: "AL",
    		county: "Limestone County",
    		avgInfected: 319.5
    	},
    	{
    		state: "AL",
    		county: "Lowndes County",
    		avgInfected: 64.16666666666667
    	},
    	{
    		state: "AL",
    		county: "Macon County",
    		avgInfected: 56.666666666666664
    	},
    	{
    		state: "AL",
    		county: "Madison County",
    		avgInfected: 986.1666666666666
    	},
    	{
    		state: "AL",
    		county: "Marengo County",
    		avgInfected: 96.41666666666667
    	},
    	{
    		state: "AL",
    		county: "Marion County",
    		avgInfected: 108.58333333333333
    	},
    	{
    		state: "AL",
    		county: "Marshall County",
    		avgInfected: 464.5833333333333
    	},
    	{
    		state: "AL",
    		county: "Mobile County",
    		avgInfected: 1580.5
    	},
    	{
    		state: "AL",
    		county: "Monroe County",
    		avgInfected: 62.666666666666664
    	},
    	{
    		state: "AL",
    		county: "Montgomery County",
    		avgInfected: 986.4166666666666
    	},
    	{
    		state: "AL",
    		county: "Morgan County",
    		avgInfected: 478.1666666666667
    	},
    	{
    		state: "AL",
    		county: "Perry County",
    		avgInfected: 54.25
    	},
    	{
    		state: "AL",
    		county: "Pickens County",
    		avgInfected: 92.33333333333333
    	},
    	{
    		state: "AL",
    		county: "Pike County",
    		avgInfected: 126.66666666666667
    	},
    	{
    		state: "AL",
    		county: "Randolph County",
    		avgInfected: 80.66666666666667
    	},
    	{
    		state: "AL",
    		county: "Russell County",
    		avgInfected: 175.33333333333334
    	},
    	{
    		state: "AL",
    		county: "St. Clair County",
    		avgInfected: 321.3333333333333
    	},
    	{
    		state: "AL",
    		county: "Shelby County",
    		avgInfected: 787
    	},
    	{
    		state: "AL",
    		county: "Sumter County",
    		avgInfected: 45.583333333333336
    	},
    	{
    		state: "AL",
    		county: "Talladega County",
    		avgInfected: 271.9166666666667
    	},
    	{
    		state: "AL",
    		county: "Tallapoosa County",
    		avgInfected: 138.75
    	},
    	{
    		state: "AL",
    		county: "Tuscaloosa County",
    		avgInfected: 1014.9166666666666
    	},
    	{
    		state: "AL",
    		county: "Walker County",
    		avgInfected: 283.25
    	},
    	{
    		state: "AL",
    		county: "Washington County",
    		avgInfected: 73.66666666666667
    	},
    	{
    		state: "AL",
    		county: "Wilcox County",
    		avgInfected: 51.583333333333336
    	},
    	{
    		state: "AL",
    		county: "Winston County",
    		avgInfected: 98.58333333333333
    	},
    	{
    		state: "AK",
    		county: "Statewide Unallocated",
    		avgInfected: 0.8333333333333334
    	},
    	{
    		state: "AK",
    		county: "Aleutians East Borough",
    		avgInfected: 0.9166666666666666
    	},
    	{
    		state: "AK",
    		county: "Aleutians West Census Area",
    		avgInfected: 1.0833333333333333
    	},
    	{
    		state: "AK",
    		county: "Municipality of Anchorage",
    		avgInfected: 1149.5
    	},
    	{
    		state: "AK",
    		county: "Bethel Census Area",
    		avgInfected: 89.91666666666667
    	},
    	{
    		state: "AK",
    		county: "Bristol Bay Borough",
    		avgInfected: 0
    	},
    	{
    		state: "AK",
    		county: "Denali Borough",
    		avgInfected: 3
    	},
    	{
    		state: "AK",
    		county: "Dillingham Census Area",
    		avgInfected: 4.833333333333333
    	},
    	{
    		state: "AK",
    		county: "Fairbanks North Star Borough",
    		avgInfected: 246.66666666666666
    	},
    	{
    		state: "AK",
    		county: "Haines Borough",
    		avgInfected: 0.8333333333333334
    	},
    	{
    		state: "AK",
    		county: "Hoonah-Angoon Census Area",
    		avgInfected: 2.9166666666666665
    	},
    	{
    		state: "AK",
    		county: "City and Borough of Juneau",
    		avgInfected: 56.833333333333336
    	},
    	{
    		state: "AK",
    		county: "Kenai Peninsula Borough",
    		avgInfected: 151.83333333333334
    	},
    	{
    		state: "AK",
    		county: "Ketchikan Gateway Borough",
    		avgInfected: 13.333333333333334
    	},
    	{
    		state: "AK",
    		county: "Kodiak Island Borough",
    		avgInfected: 10.666666666666666
    	},
    	{
    		state: "AK",
    		county: "Kusilvak Census Area",
    		avgInfected: 31.166666666666668
    	},
    	{
    		state: "AK",
    		county: "Lake and Peninsula Borough",
    		avgInfected: 5.5
    	},
    	{
    		state: "AK",
    		county: "Matanuska-Susitna Borough",
    		avgInfected: 206.41666666666666
    	},
    	{
    		state: "AK",
    		county: "Nome Census Area",
    		avgInfected: 14.5
    	},
    	{
    		state: "AK",
    		county: "North Slope Borough",
    		avgInfected: 31.75
    	},
    	{
    		state: "AK",
    		county: "Northwest Arctic Borough",
    		avgInfected: 26.75
    	},
    	{
    		state: "AK",
    		county: "Petersburg Census Area",
    		avgInfected: 1.5
    	},
    	{
    		state: "AK",
    		county: "Prince of Wales-Hyder Census Area",
    		avgInfected: 3.75
    	},
    	{
    		state: "AK",
    		county: "Sitka City and Borough",
    		avgInfected: 9.75
    	},
    	{
    		state: "AK",
    		county: "Skagway Municipality",
    		avgInfected: 0.5833333333333334
    	},
    	{
    		state: "AK",
    		county: "Southeast Fairbanks Census Area",
    		avgInfected: 15.833333333333334
    	},
    	{
    		state: "AK",
    		county: "Valdez-Cordova Census Area",
    		avgInfected: 15.333333333333334
    	},
    	{
    		state: "AK",
    		county: "Wade Hampton Census Area",
    		avgInfected: 0
    	},
    	{
    		state: "AK",
    		county: "Wrangell City and Borough",
    		avgInfected: 1.1666666666666667
    	},
    	{
    		state: "AK",
    		county: "Yakutat City and Borough",
    		avgInfected: 0
    	},
    	{
    		state: "AK",
    		county: "Yukon-Koyukuk Census Area",
    		avgInfected: 12.333333333333334
    	},
    	{
    		state: "AZ",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "AZ",
    		county: "Apache County",
    		avgInfected: 385.1666666666667
    	},
    	{
    		state: "AZ",
    		county: "Cochise County",
    		avgInfected: 235.66666666666666
    	},
    	{
    		state: "AZ",
    		county: "Coconino County",
    		avgInfected: 551.5
    	},
    	{
    		state: "AZ",
    		county: "Gila County",
    		avgInfected: 205.5
    	},
    	{
    		state: "AZ",
    		county: "Graham County",
    		avgInfected: 147.25
    	},
    	{
    		state: "AZ",
    		county: "Greenlee County",
    		avgInfected: 12.166666666666666
    	},
    	{
    		state: "AZ",
    		county: "La Paz County",
    		avgInfected: 60.166666666666664
    	},
    	{
    		state: "AZ",
    		county: "Maricopa County",
    		avgInfected: 15264.75
    	},
    	{
    		state: "AZ",
    		county: "Mohave County",
    		avgInfected: 444.0833333333333
    	},
    	{
    		state: "AZ",
    		county: "Navajo County",
    		avgInfected: 612.0833333333334
    	},
    	{
    		state: "AZ",
    		county: "Pima County",
    		avgInfected: 2868.5833333333335
    	},
    	{
    		state: "AZ",
    		county: "Pinal County",
    		avgInfected: 1214.25
    	},
    	{
    		state: "AZ",
    		county: "Santa Cruz County",
    		avgInfected: 284.0833333333333
    	},
    	{
    		state: "AZ",
    		county: "Yavapai County",
    		avgInfected: 332.4166666666667
    	},
    	{
    		state: "AZ",
    		county: "Yuma County",
    		avgInfected: 1317.75
    	},
    	{
    		state: "AR",
    		county: "Statewide Unallocated",
    		avgInfected: 198.58333333333334
    	},
    	{
    		state: "AR",
    		county: "Arkansas County",
    		avgInfected: 73.41666666666667
    	},
    	{
    		state: "AR",
    		county: "Ashley County",
    		avgInfected: 59.416666666666664
    	},
    	{
    		state: "AR",
    		county: "Baxter County",
    		avgInfected: 98.5
    	},
    	{
    		state: "AR",
    		county: "Benton County",
    		avgInfected: 895.5833333333334
    	},
    	{
    		state: "AR",
    		county: "Boone County",
    		avgInfected: 124.08333333333333
    	},
    	{
    		state: "AR",
    		county: "Bradley County",
    		avgInfected: 34.583333333333336
    	},
    	{
    		state: "AR",
    		county: "Calhoun County",
    		avgInfected: 9.75
    	},
    	{
    		state: "AR",
    		county: "Carroll County",
    		avgInfected: 101.91666666666667
    	},
    	{
    		state: "AR",
    		county: "Chicot County",
    		avgInfected: 92.58333333333333
    	},
    	{
    		state: "AR",
    		county: "Clark County",
    		avgInfected: 59.666666666666664
    	},
    	{
    		state: "AR",
    		county: "Clay County",
    		avgInfected: 61.833333333333336
    	},
    	{
    		state: "AR",
    		county: "Cleburne County",
    		avgInfected: 52
    	},
    	{
    		state: "AR",
    		county: "Cleveland County",
    		avgInfected: 26.833333333333332
    	},
    	{
    		state: "AR",
    		county: "Columbia County",
    		avgInfected: 77.41666666666667
    	},
    	{
    		state: "AR",
    		county: "Conway County",
    		avgInfected: 46.166666666666664
    	},
    	{
    		state: "AR",
    		county: "Craighead County",
    		avgInfected: 526.5833333333334
    	},
    	{
    		state: "AR",
    		county: "Crawford County",
    		avgInfected: 232.08333333333334
    	},
    	{
    		state: "AR",
    		county: "Crittenden County",
    		avgInfected: 250.91666666666666
    	},
    	{
    		state: "AR",
    		county: "Cross County",
    		avgInfected: 60.333333333333336
    	},
    	{
    		state: "AR",
    		county: "Dallas County",
    		avgInfected: 21.166666666666668
    	},
    	{
    		state: "AR",
    		county: "Desha County",
    		avgInfected: 41.916666666666664
    	},
    	{
    		state: "AR",
    		county: "Drew County",
    		avgInfected: 45.416666666666664
    	},
    	{
    		state: "AR",
    		county: "Faulkner County",
    		avgInfected: 357.6666666666667
    	},
    	{
    		state: "AR",
    		county: "Franklin County",
    		avgInfected: 57.5
    	},
    	{
    		state: "AR",
    		county: "Fulton County",
    		avgInfected: 39.416666666666664
    	},
    	{
    		state: "AR",
    		county: "Garland County",
    		avgInfected: 279.1666666666667
    	},
    	{
    		state: "AR",
    		county: "Grant County",
    		avgInfected: 41.833333333333336
    	},
    	{
    		state: "AR",
    		county: "Greene County",
    		avgInfected: 200.08333333333334
    	},
    	{
    		state: "AR",
    		county: "Hempstead County",
    		avgInfected: 63.25
    	},
    	{
    		state: "AR",
    		county: "Hot Spring County",
    		avgInfected: 224.08333333333334
    	},
    	{
    		state: "AR",
    		county: "Howard County",
    		avgInfected: 62.25
    	},
    	{
    		state: "AR",
    		county: "Independence County",
    		avgInfected: 159.5
    	},
    	{
    		state: "AR",
    		county: "Izard County",
    		avgInfected: 77.75
    	},
    	{
    		state: "AR",
    		county: "Jackson County",
    		avgInfected: 122
    	},
    	{
    		state: "AR",
    		county: "Jefferson County",
    		avgInfected: 407.8333333333333
    	},
    	{
    		state: "AR",
    		county: "Johnson County",
    		avgInfected: 98.33333333333333
    	},
    	{
    		state: "AR",
    		county: "Lafayette County",
    		avgInfected: 20.5
    	},
    	{
    		state: "AR",
    		county: "Lawrence County",
    		avgInfected: 87.83333333333333
    	},
    	{
    		state: "AR",
    		county: "Lee County",
    		avgInfected: 95.58333333333333
    	},
    	{
    		state: "AR",
    		county: "Lincoln County",
    		avgInfected: 198.25
    	},
    	{
    		state: "AR",
    		county: "Little River County",
    		avgInfected: 49
    	},
    	{
    		state: "AR",
    		county: "Logan County",
    		avgInfected: 68
    	},
    	{
    		state: "AR",
    		county: "Lonoke County",
    		avgInfected: 199.08333333333334
    	},
    	{
    		state: "AR",
    		county: "Madison County",
    		avgInfected: 45.25
    	},
    	{
    		state: "AR",
    		county: "Marion County",
    		avgInfected: 29.25
    	},
    	{
    		state: "AR",
    		county: "Miller County",
    		avgInfected: 165.58333333333334
    	},
    	{
    		state: "AR",
    		county: "Mississippi County",
    		avgInfected: 244.5
    	},
    	{
    		state: "AR",
    		county: "Monroe County",
    		avgInfected: 23.083333333333332
    	},
    	{
    		state: "AR",
    		county: "Montgomery County",
    		avgInfected: 19.25
    	},
    	{
    		state: "AR",
    		county: "Nevada County",
    		avgInfected: 34
    	},
    	{
    		state: "AR",
    		county: "Newton County",
    		avgInfected: 32.833333333333336
    	},
    	{
    		state: "AR",
    		county: "Ouachita County",
    		avgInfected: 46.833333333333336
    	},
    	{
    		state: "AR",
    		county: "Perry County",
    		avgInfected: 18.083333333333332
    	},
    	{
    		state: "AR",
    		county: "Phillips County",
    		avgInfected: 71.91666666666667
    	},
    	{
    		state: "AR",
    		county: "Pike County",
    		avgInfected: 28
    	},
    	{
    		state: "AR",
    		county: "Poinsett County",
    		avgInfected: 129.33333333333334
    	},
    	{
    		state: "AR",
    		county: "Polk County",
    		avgInfected: 53.5
    	},
    	{
    		state: "AR",
    		county: "Pope County",
    		avgInfected: 281.1666666666667
    	},
    	{
    		state: "AR",
    		county: "Prairie County",
    		avgInfected: 27.5
    	},
    	{
    		state: "AR",
    		county: "Pulaski County",
    		avgInfected: 1254.0833333333333
    	},
    	{
    		state: "AR",
    		county: "Randolph County",
    		avgInfected: 74.33333333333333
    	},
    	{
    		state: "AR",
    		county: "St. Francis County",
    		avgInfected: 162.41666666666666
    	},
    	{
    		state: "AR",
    		county: "Saline County",
    		avgInfected: 341.1666666666667
    	},
    	{
    		state: "AR",
    		county: "Scott County",
    		avgInfected: 26.333333333333332
    	},
    	{
    		state: "AR",
    		county: "Searcy County",
    		avgInfected: 22.083333333333332
    	},
    	{
    		state: "AR",
    		county: "Sebastian County",
    		avgInfected: 532.1666666666666
    	},
    	{
    		state: "AR",
    		county: "Sevier County",
    		avgInfected: 135
    	},
    	{
    		state: "AR",
    		county: "Sharp County",
    		avgInfected: 48.166666666666664
    	},
    	{
    		state: "AR",
    		county: "Stone County",
    		avgInfected: 36.25
    	},
    	{
    		state: "AR",
    		county: "Union County",
    		avgInfected: 116.08333333333333
    	},
    	{
    		state: "AR",
    		county: "Van Buren County",
    		avgInfected: 24.666666666666668
    	},
    	{
    		state: "AR",
    		county: "Washington County",
    		avgInfected: 1173.5833333333333
    	},
    	{
    		state: "AR",
    		county: "White County",
    		avgInfected: 214.83333333333334
    	},
    	{
    		state: "AR",
    		county: "Woodruff County",
    		avgInfected: 14.916666666666666
    	},
    	{
    		state: "AR",
    		county: "Yell County",
    		avgInfected: 128.75
    	},
    	{
    		state: "CA",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "CA",
    		county: "Grand Princess Cruise Ship",
    		avgInfected: 1.75
    	},
    	{
    		state: "CA",
    		county: "Alameda County",
    		avgInfected: 2243.9166666666665
    	},
    	{
    		state: "CA",
    		county: "Alpine County",
    		avgInfected: 2.1666666666666665
    	},
    	{
    		state: "CA",
    		county: "Amador County",
    		avgInfected: 34.166666666666664
    	},
    	{
    		state: "CA",
    		county: "Butte County",
    		avgInfected: 298.3333333333333
    	},
    	{
    		state: "CA",
    		county: "Calaveras County",
    		avgInfected: 33.25
    	},
    	{
    		state: "CA",
    		county: "Colusa County",
    		avgInfected: 51.916666666666664
    	},
    	{
    		state: "CA",
    		county: "Contra Costa County",
    		avgInfected: 1829.9166666666667
    	},
    	{
    		state: "CA",
    		county: "Del Norte County",
    		avgInfected: 21.583333333333332
    	},
    	{
    		state: "CA",
    		county: "El Dorado County",
    		avgInfected: 158.25
    	},
    	{
    		state: "CA",
    		county: "Fresno County",
    		avgInfected: 2916.4166666666665
    	},
    	{
    		state: "CA",
    		county: "Glenn County",
    		avgInfected: 68.33333333333333
    	},
    	{
    		state: "CA",
    		county: "Humboldt County",
    		avgInfected: 59.25
    	},
    	{
    		state: "CA",
    		county: "Imperial County",
    		avgInfected: 1220.3333333333333
    	},
    	{
    		state: "CA",
    		county: "Inyo County",
    		avgInfected: 22.333333333333332
    	},
    	{
    		state: "CA",
    		county: "Kern County",
    		avgInfected: 3136
    	},
    	{
    		state: "CA",
    		county: "Kings County",
    		avgInfected: 814.5833333333334
    	},
    	{
    		state: "CA",
    		county: "Lake County",
    		avgInfected: 67.91666666666667
    	},
    	{
    		state: "CA",
    		county: "Lassen County",
    		avgInfected: 99.66666666666667
    	},
    	{
    		state: "CA",
    		county: "Los Angeles County",
    		avgInfected: 29436
    	},
    	{
    		state: "CA",
    		county: "Madera County",
    		avgInfected: 468.6666666666667
    	},
    	{
    		state: "CA",
    		county: "Marin County",
    		avgInfected: 624.0833333333334
    	},
    	{
    		state: "CA",
    		county: "Mariposa County",
    		avgInfected: 7.75
    	},
    	{
    		state: "CA",
    		county: "Mendocino County",
    		avgInfected: 114
    	},
    	{
    		state: "CA",
    		county: "Merced County",
    		avgInfected: 907
    	},
    	{
    		state: "CA",
    		county: "Modoc County",
    		avgInfected: 8.833333333333334
    	},
    	{
    		state: "CA",
    		county: "Mono County",
    		avgInfected: 41.25
    	},
    	{
    		state: "CA",
    		county: "Monterey County",
    		avgInfected: 1127
    	},
    	{
    		state: "CA",
    		county: "Napa County",
    		avgInfected: 218.58333333333334
    	},
    	{
    		state: "CA",
    		county: "Nevada County",
    		avgInfected: 79
    	},
    	{
    		state: "CA",
    		county: "Orange County",
    		avgInfected: 5597.25
    	},
    	{
    		state: "CA",
    		county: "Placer County",
    		avgInfected: 461.9166666666667
    	},
    	{
    		state: "CA",
    		county: "Plumas County",
    		avgInfected: 7.833333333333333
    	},
    	{
    		state: "CA",
    		county: "Riverside County",
    		avgInfected: 6500.75
    	},
    	{
    		state: "CA",
    		county: "Sacramento County",
    		avgInfected: 2700.9166666666665
    	},
    	{
    		state: "CA",
    		county: "San Benito County",
    		avgInfected: 139.66666666666666
    	},
    	{
    		state: "CA",
    		county: "San Bernardino County",
    		avgInfected: 6693.166666666667
    	},
    	{
    		state: "CA",
    		county: "San Diego County",
    		avgInfected: 5678.333333333333
    	},
    	{
    		state: "CA",
    		county: "San Francisco County",
    		avgInfected: 1187.5833333333333
    	},
    	{
    		state: "CA",
    		county: "San Joaquin County",
    		avgInfected: 2037.5
    	},
    	{
    		state: "CA",
    		county: "San Luis Obispo County",
    		avgInfected: 457.1666666666667
    	},
    	{
    		state: "CA",
    		county: "San Mateo County",
    		avgInfected: 1082.3333333333333
    	},
    	{
    		state: "CA",
    		county: "Santa Barbara County",
    		avgInfected: 897.3333333333334
    	},
    	{
    		state: "CA",
    		county: "Santa Clara County",
    		avgInfected: 2469.25
    	},
    	{
    		state: "CA",
    		county: "Santa Cruz County",
    		avgInfected: 318.25
    	},
    	{
    		state: "CA",
    		county: "Shasta County",
    		avgInfected: 309.9166666666667
    	},
    	{
    		state: "CA",
    		county: "Sierra County",
    		avgInfected: 1.4166666666666667
    	},
    	{
    		state: "CA",
    		county: "Siskiyou County",
    		avgInfected: 38.833333333333336
    	},
    	{
    		state: "CA",
    		county: "Solano County",
    		avgInfected: 774.25
    	},
    	{
    		state: "CA",
    		county: "Sonoma County",
    		avgInfected: 943
    	},
    	{
    		state: "CA",
    		county: "Stanislaus County",
    		avgInfected: 1650.1666666666667
    	},
    	{
    		state: "CA",
    		county: "Sutter County",
    		avgInfected: 216.75
    	},
    	{
    		state: "CA",
    		county: "Tehama County",
    		avgInfected: 114.75
    	},
    	{
    		state: "CA",
    		county: "Trinity County",
    		avgInfected: 8.833333333333334
    	},
    	{
    		state: "CA",
    		county: "Tulare County",
    		avgInfected: 1629.4166666666667
    	},
    	{
    		state: "CA",
    		county: "Tuolumne County",
    		avgInfected: 56.25
    	},
    	{
    		state: "CA",
    		county: "Ventura County",
    		avgInfected: 1430.25
    	},
    	{
    		state: "CA",
    		county: "Yolo County",
    		avgInfected: 331.75
    	},
    	{
    		state: "CA",
    		county: "Yuba County",
    		avgInfected: 142.16666666666666
    	},
    	{
    		state: "CO",
    		county: "Statewide Unallocated",
    		avgInfected: 2.0833333333333335
    	},
    	{
    		state: "CO",
    		county: "Adams County",
    		avgInfected: 2042
    	},
    	{
    		state: "CO",
    		county: "Alamosa County",
    		avgInfected: 40.666666666666664
    	},
    	{
    		state: "CO",
    		county: "Arapahoe County",
    		avgInfected: 1850
    	},
    	{
    		state: "CO",
    		county: "Archuleta County",
    		avgInfected: 10
    	},
    	{
    		state: "CO",
    		county: "Baca County",
    		avgInfected: 4.333333333333333
    	},
    	{
    		state: "CO",
    		county: "Bent County",
    		avgInfected: 3.8333333333333335
    	},
    	{
    		state: "CO",
    		county: "Boulder County",
    		avgInfected: 769.25
    	},
    	{
    		state: "CO",
    		county: "Broomfield County and City",
    		avgInfected: 138
    	},
    	{
    		state: "CO",
    		county: "Chaffee County",
    		avgInfected: 43.166666666666664
    	},
    	{
    		state: "CO",
    		county: "Cheyenne County",
    		avgInfected: 3.4166666666666665
    	},
    	{
    		state: "CO",
    		county: "Clear Creek County",
    		avgInfected: 13.083333333333334
    	},
    	{
    		state: "CO",
    		county: "Conejos County",
    		avgInfected: 11.583333333333334
    	},
    	{
    		state: "CO",
    		county: "Costilla County",
    		avgInfected: 5.25
    	},
    	{
    		state: "CO",
    		county: "Crowley County",
    		avgInfected: 66.33333333333333
    	},
    	{
    		state: "CO",
    		county: "Custer County",
    		avgInfected: 4.5
    	},
    	{
    		state: "CO",
    		county: "Delta County",
    		avgInfected: 34.75
    	},
    	{
    		state: "CO",
    		county: "Denver County",
    		avgInfected: 2526.75
    	},
    	{
    		state: "CO",
    		county: "Dolores County",
    		avgInfected: 0.5833333333333334
    	},
    	{
    		state: "CO",
    		county: "Douglas County",
    		avgInfected: 683.25
    	},
    	{
    		state: "CO",
    		county: "Eagle County",
    		avgInfected: 165.58333333333334
    	},
    	{
    		state: "CO",
    		county: "Elbert County",
    		avgInfected: 37.25
    	},
    	{
    		state: "CO",
    		county: "El Paso County",
    		avgInfected: 1700.0833333333333
    	},
    	{
    		state: "CO",
    		county: "Fremont County",
    		avgInfected: 156.25
    	},
    	{
    		state: "CO",
    		county: "Garfield County",
    		avgInfected: 145.33333333333334
    	},
    	{
    		state: "CO",
    		county: "Gilpin County",
    		avgInfected: 6.083333333333333
    	},
    	{
    		state: "CO",
    		county: "Grand County",
    		avgInfected: 20.916666666666668
    	},
    	{
    		state: "CO",
    		county: "Gunnison County",
    		avgInfected: 35.666666666666664
    	},
    	{
    		state: "CO",
    		county: "Hinsdale County",
    		avgInfected: 0.5
    	},
    	{
    		state: "CO",
    		county: "Huerfano County",
    		avgInfected: 8.166666666666666
    	},
    	{
    		state: "CO",
    		county: "Jackson County",
    		avgInfected: 1.1666666666666667
    	},
    	{
    		state: "CO",
    		county: "Jefferson County",
    		avgInfected: 1358.25
    	},
    	{
    		state: "CO",
    		county: "Kiowa County",
    		avgInfected: 1.5
    	},
    	{
    		state: "CO",
    		county: "Kit Carson County",
    		avgInfected: 20.166666666666668
    	},
    	{
    		state: "CO",
    		county: "Lake County",
    		avgInfected: 18.416666666666668
    	},
    	{
    		state: "CO",
    		county: "La Plata County",
    		avgInfected: 59.166666666666664
    	},
    	{
    		state: "CO",
    		county: "Larimer County",
    		avgInfected: 661.4166666666666
    	},
    	{
    		state: "CO",
    		county: "Las Animas County",
    		avgInfected: 11.916666666666666
    	},
    	{
    		state: "CO",
    		county: "Lincoln County",
    		avgInfected: 8.5
    	},
    	{
    		state: "CO",
    		county: "Logan County",
    		avgInfected: 158.58333333333334
    	},
    	{
    		state: "CO",
    		county: "Mesa County",
    		avgInfected: 362.8333333333333
    	},
    	{
    		state: "CO",
    		county: "Mineral County",
    		avgInfected: 1.75
    	},
    	{
    		state: "CO",
    		county: "Moffat County",
    		avgInfected: 16
    	},
    	{
    		state: "CO",
    		county: "Montezuma County",
    		avgInfected: 40.25
    	},
    	{
    		state: "CO",
    		county: "Montrose County",
    		avgInfected: 59.5
    	},
    	{
    		state: "CO",
    		county: "Morgan County",
    		avgInfected: 113.08333333333333
    	},
    	{
    		state: "CO",
    		county: "Otero County",
    		avgInfected: 30.25
    	},
    	{
    		state: "CO",
    		county: "Ouray County",
    		avgInfected: 8.666666666666666
    	},
    	{
    		state: "CO",
    		county: "Park County",
    		avgInfected: 15.5
    	},
    	{
    		state: "CO",
    		county: "Phillips County",
    		avgInfected: 12.083333333333334
    	},
    	{
    		state: "CO",
    		county: "Pitkin County",
    		avgInfected: 34.416666666666664
    	},
    	{
    		state: "CO",
    		county: "Prowers County",
    		avgInfected: 34.166666666666664
    	},
    	{
    		state: "CO",
    		county: "Pueblo County",
    		avgInfected: 478
    	},
    	{
    		state: "CO",
    		county: "Rio Blanco County",
    		avgInfected: 6.666666666666667
    	},
    	{
    		state: "CO",
    		county: "Rio Grande County",
    		avgInfected: 15.416666666666666
    	},
    	{
    		state: "CO",
    		county: "Routt County",
    		avgInfected: 39.333333333333336
    	},
    	{
    		state: "CO",
    		county: "Saguache County",
    		avgInfected: 16.25
    	},
    	{
    		state: "CO",
    		county: "San Juan County",
    		avgInfected: 1.5833333333333333
    	},
    	{
    		state: "CO",
    		county: "San Miguel County",
    		avgInfected: 14.416666666666666
    	},
    	{
    		state: "CO",
    		county: "Sedgwick County",
    		avgInfected: 7.583333333333333
    	},
    	{
    		state: "CO",
    		county: "Summit County",
    		avgInfected: 102.25
    	},
    	{
    		state: "CO",
    		county: "Teller County",
    		avgInfected: 40.25
    	},
    	{
    		state: "CO",
    		county: "Washington County",
    		avgInfected: 14.416666666666666
    	},
    	{
    		state: "CO",
    		county: "Weld County",
    		avgInfected: 917.4166666666666
    	},
    	{
    		state: "CO",
    		county: "Yuma County",
    		avgInfected: 23.583333333333332
    	},
    	{
    		state: "CT",
    		county: "Statewide Unallocated",
    		avgInfected: 33.583333333333336
    	},
    	{
    		state: "CT",
    		county: "Fairfield County",
    		avgInfected: 2755.5833333333335
    	},
    	{
    		state: "CT",
    		county: "Hartford County",
    		avgInfected: 2058.8333333333335
    	},
    	{
    		state: "CT",
    		county: "Litchfield County",
    		avgInfected: 291.6666666666667
    	},
    	{
    		state: "CT",
    		county: "Middlesex County",
    		avgInfected: 252.08333333333334
    	},
    	{
    		state: "CT",
    		county: "New Haven County",
    		avgInfected: 2061.0833333333335
    	},
    	{
    		state: "CT",
    		county: "New London County",
    		avgInfected: 438
    	},
    	{
    		state: "CT",
    		county: "Tolland County",
    		avgInfected: 214.41666666666666
    	},
    	{
    		state: "CT",
    		county: "Windham County",
    		avgInfected: 176.5
    	},
    	{
    		state: "DE",
    		county: "Statewide Unallocated",
    		avgInfected: 8.083333333333334
    	},
    	{
    		state: "DE",
    		county: "Kent County",
    		avgInfected: 352.1666666666667
    	},
    	{
    		state: "DE",
    		county: "New Castle County",
    		avgInfected: 1374.75
    	},
    	{
    		state: "DE",
    		county: "Sussex County",
    		avgInfected: 778.9166666666666
    	},
    	{
    		state: "DC",
    		county: "Washington",
    		avgInfected: 1639.8333333333333
    	},
    	{
    		state: "FL",
    		county: "Statewide Unallocated",
    		avgInfected: 182
    	},
    	{
    		state: "FL",
    		county: "Alachua County",
    		avgInfected: 1009.4166666666666
    	},
    	{
    		state: "FL",
    		county: "Baker County",
    		avgInfected: 161.75
    	},
    	{
    		state: "FL",
    		county: "Bay County",
    		avgInfected: 659.3333333333334
    	},
    	{
    		state: "FL",
    		county: "Bradford County",
    		avgInfected: 112
    	},
    	{
    		state: "FL",
    		county: "Brevard County",
    		avgInfected: 1176
    	},
    	{
    		state: "FL",
    		county: "Broward County",
    		avgInfected: 8198.083333333334
    	},
    	{
    		state: "FL",
    		county: "Calhoun County",
    		avgInfected: 68.16666666666667
    	},
    	{
    		state: "FL",
    		county: "Charlotte County",
    		avgInfected: 375.25
    	},
    	{
    		state: "FL",
    		county: "Citrus County",
    		avgInfected: 343.75
    	},
    	{
    		state: "FL",
    		county: "Clay County",
    		avgInfected: 598.4166666666666
    	},
    	{
    		state: "FL",
    		county: "Collier County",
    		avgInfected: 1370.5833333333333
    	},
    	{
    		state: "FL",
    		county: "Columbia County",
    		avgInfected: 380.9166666666667
    	},
    	{
    		state: "FL",
    		county: "DeSoto County",
    		avgInfected: 176.5
    	},
    	{
    		state: "FL",
    		county: "Dixie County",
    		avgInfected: 78.58333333333333
    	},
    	{
    		state: "FL",
    		county: "Duval County",
    		avgInfected: 3312.0833333333335
    	},
    	{
    		state: "FL",
    		county: "Escambia County",
    		avgInfected: 1298.6666666666667
    	},
    	{
    		state: "FL",
    		county: "Flagler County",
    		avgInfected: 207
    	},
    	{
    		state: "FL",
    		county: "Franklin County",
    		avgInfected: 67.75
    	},
    	{
    		state: "FL",
    		county: "Gadsden County",
    		avgInfected: 264.9166666666667
    	},
    	{
    		state: "FL",
    		county: "Gilchrist County",
    		avgInfected: 58.75
    	},
    	{
    		state: "FL",
    		county: "Glades County",
    		avgInfected: 53.833333333333336
    	},
    	{
    		state: "FL",
    		county: "Gulf County",
    		avgInfected: 85.75
    	},
    	{
    		state: "FL",
    		county: "Hamilton County",
    		avgInfected: 79.33333333333333
    	},
    	{
    		state: "FL",
    		county: "Hardee County",
    		avgInfected: 142.75
    	},
    	{
    		state: "FL",
    		county: "Hendry County",
    		avgInfected: 200.08333333333334
    	},
    	{
    		state: "FL",
    		county: "Hernando County",
    		avgInfected: 370
    	},
    	{
    		state: "FL",
    		county: "Highlands County",
    		avgInfected: 281
    	},
    	{
    		state: "FL",
    		county: "Hillsborough County",
    		avgInfected: 4527.166666666667
    	},
    	{
    		state: "FL",
    		county: "Holmes County",
    		avgInfected: 88.5
    	},
    	{
    		state: "FL",
    		county: "Indian River County",
    		avgInfected: 385.0833333333333
    	},
    	{
    		state: "FL",
    		county: "Jackson County",
    		avgInfected: 302.3333333333333
    	},
    	{
    		state: "FL",
    		county: "Jefferson County",
    		avgInfected: 60.666666666666664
    	},
    	{
    		state: "FL",
    		county: "Lafayette County",
    		avgInfected: 107.83333333333333
    	},
    	{
    		state: "FL",
    		county: "Lake County",
    		avgInfected: 822.6666666666666
    	},
    	{
    		state: "FL",
    		county: "Lee County",
    		avgInfected: 2272.9166666666665
    	},
    	{
    		state: "FL",
    		county: "Leon County",
    		avgInfected: 1162.25
    	},
    	{
    		state: "FL",
    		county: "Levy County",
    		avgInfected: 109
    	},
    	{
    		state: "FL",
    		county: "Liberty County",
    		avgInfected: 46.583333333333336
    	},
    	{
    		state: "FL",
    		county: "Madison County",
    		avgInfected: 100.08333333333333
    	},
    	{
    		state: "FL",
    		county: "Manatee County",
    		avgInfected: 1278.5833333333333
    	},
    	{
    		state: "FL",
    		county: "Marion County",
    		avgInfected: 1005.0833333333334
    	},
    	{
    		state: "FL",
    		county: "Martin County",
    		avgInfected: 488.5
    	},
    	{
    		state: "FL",
    		county: "Miami-Dade County",
    		avgInfected: 17430.5
    	},
    	{
    		state: "FL",
    		county: "Monroe County",
    		avgInfected: 247.08333333333334
    	},
    	{
    		state: "FL",
    		county: "Nassau County",
    		avgInfected: 236.41666666666666
    	},
    	{
    		state: "FL",
    		county: "Okaloosa County",
    		avgInfected: 665
    	},
    	{
    		state: "FL",
    		county: "Okeechobee County",
    		avgInfected: 160.5
    	},
    	{
    		state: "FL",
    		county: "Orange County",
    		avgInfected: 4448.666666666667
    	},
    	{
    		state: "FL",
    		county: "Osceola County",
    		avgInfected: 1391.0833333333333
    	},
    	{
    		state: "FL",
    		county: "Palm Beach County",
    		avgInfected: 5018.25
    	},
    	{
    		state: "FL",
    		county: "Pasco County",
    		avgInfected: 1096.3333333333333
    	},
    	{
    		state: "FL",
    		county: "Pinellas County",
    		avgInfected: 2500.5
    	},
    	{
    		state: "FL",
    		county: "Polk County",
    		avgInfected: 2158.0833333333335
    	},
    	{
    		state: "FL",
    		county: "Putnam County",
    		avgInfected: 216.33333333333334
    	},
    	{
    		state: "FL",
    		county: "St. Johns County",
    		avgInfected: 648.8333333333334
    	},
    	{
    		state: "FL",
    		county: "St. Lucie County",
    		avgInfected: 837.6666666666666
    	},
    	{
    		state: "FL",
    		county: "Santa Rosa County",
    		avgInfected: 569.9166666666666
    	},
    	{
    		state: "FL",
    		county: "Sarasota County",
    		avgInfected: 992.0833333333334
    	},
    	{
    		state: "FL",
    		county: "Seminole County",
    		avgInfected: 990.5833333333334
    	},
    	{
    		state: "FL",
    		county: "Sumter County",
    		avgInfected: 269.1666666666667
    	},
    	{
    		state: "FL",
    		county: "Suwannee County",
    		avgInfected: 265.0833333333333
    	},
    	{
    		state: "FL",
    		county: "Taylor County",
    		avgInfected: 132.75
    	},
    	{
    		state: "FL",
    		county: "Union County",
    		avgInfected: 100.08333333333333
    	},
    	{
    		state: "FL",
    		county: "Volusia County",
    		avgInfected: 1223.4166666666667
    	},
    	{
    		state: "FL",
    		county: "Wakulla County",
    		avgInfected: 126.5
    	},
    	{
    		state: "FL",
    		county: "Walton County",
    		avgInfected: 280.6666666666667
    	},
    	{
    		state: "FL",
    		county: "Washington County",
    		avgInfected: 119
    	},
    	{
    		state: "GA",
    		county: "Statewide Unallocated",
    		avgInfected: 1473.75
    	},
    	{
    		state: "GA",
    		county: "Appling County",
    		avgInfected: 101.08333333333333
    	},
    	{
    		state: "GA",
    		county: "Atkinson County",
    		avgInfected: 42.166666666666664
    	},
    	{
    		state: "GA",
    		county: "Bacon County",
    		avgInfected: 54.833333333333336
    	},
    	{
    		state: "GA",
    		county: "Baker County",
    		avgInfected: 8.5
    	},
    	{
    		state: "GA",
    		county: "Baldwin County",
    		avgInfected: 204.16666666666666
    	},
    	{
    		state: "GA",
    		county: "Banks County",
    		avgInfected: 56.833333333333336
    	},
    	{
    		state: "GA",
    		county: "Barrow County",
    		avgInfected: 245.75
    	},
    	{
    		state: "GA",
    		county: "Bartow County",
    		avgInfected: 348.5833333333333
    	},
    	{
    		state: "GA",
    		county: "Ben Hill County",
    		avgInfected: 76.33333333333333
    	},
    	{
    		state: "GA",
    		county: "Berrien County",
    		avgInfected: 43.833333333333336
    	},
    	{
    		state: "GA",
    		county: "Bibb County",
    		avgInfected: 591.5
    	},
    	{
    		state: "GA",
    		county: "Bleckley County",
    		avgInfected: 44.833333333333336
    	},
    	{
    		state: "GA",
    		county: "Brantley County",
    		avgInfected: 42.833333333333336
    	},
    	{
    		state: "GA",
    		county: "Brooks County",
    		avgInfected: 47
    	},
    	{
    		state: "GA",
    		county: "Bryan County",
    		avgInfected: 115.25
    	},
    	{
    		state: "GA",
    		county: "Bulloch County",
    		avgInfected: 270
    	},
    	{
    		state: "GA",
    		county: "Burke County",
    		avgInfected: 80.66666666666667
    	},
    	{
    		state: "GA",
    		county: "Butts County",
    		avgInfected: 69.41666666666667
    	},
    	{
    		state: "GA",
    		county: "Calhoun County",
    		avgInfected: 22.5
    	},
    	{
    		state: "GA",
    		county: "Camden County",
    		avgInfected: 134.91666666666666
    	},
    	{
    		state: "GA",
    		county: "Candler County",
    		avgInfected: 47.333333333333336
    	},
    	{
    		state: "GA",
    		county: "Carroll County",
    		avgInfected: 318.75
    	},
    	{
    		state: "GA",
    		county: "Catoosa County",
    		avgInfected: 152.5
    	},
    	{
    		state: "GA",
    		county: "Charlton County",
    		avgInfected: 56.416666666666664
    	},
    	{
    		state: "GA",
    		county: "Chatham County",
    		avgInfected: 848.9166666666666
    	},
    	{
    		state: "GA",
    		county: "Chattahoochee County",
    		avgInfected: 159.5
    	},
    	{
    		state: "GA",
    		county: "Chattooga County",
    		avgInfected: 89.75
    	},
    	{
    		state: "GA",
    		county: "Cherokee County",
    		avgInfected: 705.6666666666666
    	},
    	{
    		state: "GA",
    		county: "Clarke County",
    		avgInfected: 531.4166666666666
    	},
    	{
    		state: "GA",
    		county: "Clay County",
    		avgInfected: 10.416666666666666
    	},
    	{
    		state: "GA",
    		county: "Clayton County",
    		avgInfected: 775.9166666666666
    	},
    	{
    		state: "GA",
    		county: "Clinch County",
    		avgInfected: 40.166666666666664
    	},
    	{
    		state: "GA",
    		county: "Cobb County",
    		avgInfected: 2062.5833333333335
    	},
    	{
    		state: "GA",
    		county: "Coffee County",
    		avgInfected: 207.33333333333334
    	},
    	{
    		state: "GA",
    		county: "Colquitt County",
    		avgInfected: 184.08333333333334
    	},
    	{
    		state: "GA",
    		county: "Columbia County",
    		avgInfected: 420.5833333333333
    	},
    	{
    		state: "GA",
    		county: "Cook County",
    		avgInfected: 58.5
    	},
    	{
    		state: "GA",
    		county: "Coweta County",
    		avgInfected: 279.3333333333333
    	},
    	{
    		state: "GA",
    		county: "Crawford County",
    		avgInfected: 17.916666666666668
    	},
    	{
    		state: "GA",
    		county: "Crisp County",
    		avgInfected: 58.333333333333336
    	},
    	{
    		state: "GA",
    		county: "Dade County",
    		avgInfected: 37.666666666666664
    	},
    	{
    		state: "GA",
    		county: "Dawson County",
    		avgInfected: 85.5
    	},
    	{
    		state: "GA",
    		county: "Decatur County",
    		avgInfected: 115.16666666666667
    	},
    	{
    		state: "GA",
    		county: "DeKalb County",
    		avgInfected: 2030.0833333333333
    	},
    	{
    		state: "GA",
    		county: "Dodge County",
    		avgInfected: 58.25
    	},
    	{
    		state: "GA",
    		county: "Dooly County",
    		avgInfected: 33.666666666666664
    	},
    	{
    		state: "GA",
    		county: "Dougherty County",
    		avgInfected: 281.9166666666667
    	},
    	{
    		state: "GA",
    		county: "Douglas County",
    		avgInfected: 386.25
    	},
    	{
    		state: "GA",
    		county: "Early County",
    		avgInfected: 49.5
    	},
    	{
    		state: "GA",
    		county: "Echols County",
    		avgInfected: 21
    	},
    	{
    		state: "GA",
    		county: "Effingham County",
    		avgInfected: 167.41666666666666
    	},
    	{
    		state: "GA",
    		county: "Elbert County",
    		avgInfected: 72
    	},
    	{
    		state: "GA",
    		county: "Emanuel County",
    		avgInfected: 105.58333333333333
    	},
    	{
    		state: "GA",
    		county: "Evans County",
    		avgInfected: 42.25
    	},
    	{
    		state: "GA",
    		county: "Fannin County",
    		avgInfected: 77.66666666666667
    	},
    	{
    		state: "GA",
    		county: "Fayette County",
    		avgInfected: 203.5
    	},
    	{
    		state: "GA",
    		county: "Floyd County",
    		avgInfected: 395.0833333333333
    	},
    	{
    		state: "GA",
    		county: "Forsyth County",
    		avgInfected: 468.3333333333333
    	},
    	{
    		state: "GA",
    		county: "Franklin County",
    		avgInfected: 91.41666666666667
    	},
    	{
    		state: "GA",
    		county: "Fulton County",
    		avgInfected: 2924.0833333333335
    	},
    	{
    		state: "GA",
    		county: "Gilmer County",
    		avgInfected: 96.5
    	},
    	{
    		state: "GA",
    		county: "Glascock County",
    		avgInfected: 5.083333333333333
    	},
    	{
    		state: "GA",
    		county: "Glynn County",
    		avgInfected: 334.25
    	},
    	{
    		state: "GA",
    		county: "Gordon County",
    		avgInfected: 239.25
    	},
    	{
    		state: "GA",
    		county: "Grady County",
    		avgInfected: 74.75
    	},
    	{
    		state: "GA",
    		county: "Greene County",
    		avgInfected: 51.666666666666664
    	},
    	{
    		state: "GA",
    		county: "Gwinnett County",
    		avgInfected: 2866.6666666666665
    	},
    	{
    		state: "GA",
    		county: "Habersham County",
    		avgInfected: 175.66666666666666
    	},
    	{
    		state: "GA",
    		county: "Hall County",
    		avgInfected: 977.75
    	},
    	{
    		state: "GA",
    		county: "Hancock County",
    		avgInfected: 37.416666666666664
    	},
    	{
    		state: "GA",
    		county: "Haralson County",
    		avgInfected: 68
    	},
    	{
    		state: "GA",
    		county: "Harris County",
    		avgInfected: 76.16666666666667
    	},
    	{
    		state: "GA",
    		county: "Hart County",
    		avgInfected: 56.5
    	},
    	{
    		state: "GA",
    		county: "Heard County",
    		avgInfected: 22.583333333333332
    	},
    	{
    		state: "GA",
    		county: "Henry County",
    		avgInfected: 591.0833333333334
    	},
    	{
    		state: "GA",
    		county: "Houston County",
    		avgInfected: 339.5
    	},
    	{
    		state: "GA",
    		county: "Irwin County",
    		avgInfected: 32.5
    	},
    	{
    		state: "GA",
    		county: "Jackson County",
    		avgInfected: 239.83333333333334
    	},
    	{
    		state: "GA",
    		county: "Jasper County",
    		avgInfected: 22.166666666666668
    	},
    	{
    		state: "GA",
    		county: "Jeff Davis County",
    		avgInfected: 68.83333333333333
    	},
    	{
    		state: "GA",
    		county: "Jefferson County",
    		avgInfected: 77.08333333333333
    	},
    	{
    		state: "GA",
    		county: "Jenkins County",
    		avgInfected: 40.5
    	},
    	{
    		state: "GA",
    		county: "Johnson County",
    		avgInfected: 38.083333333333336
    	},
    	{
    		state: "GA",
    		county: "Jones County",
    		avgInfected: 59.333333333333336
    	},
    	{
    		state: "GA",
    		county: "Lamar County",
    		avgInfected: 41.416666666666664
    	},
    	{
    		state: "GA",
    		county: "Lanier County",
    		avgInfected: 27.5
    	},
    	{
    		state: "GA",
    		county: "Laurens County",
    		avgInfected: 179.25
    	},
    	{
    		state: "GA",
    		county: "Lee County",
    		avgInfected: 65.08333333333333
    	},
    	{
    		state: "GA",
    		county: "Liberty County",
    		avgInfected: 118
    	},
    	{
    		state: "GA",
    		county: "Lincoln County",
    		avgInfected: 22.166666666666668
    	},
    	{
    		state: "GA",
    		county: "Long County",
    		avgInfected: 24.916666666666668
    	},
    	{
    		state: "GA",
    		county: "Lowndes County",
    		avgInfected: 410.0833333333333
    	},
    	{
    		state: "GA",
    		county: "Lumpkin County",
    		avgInfected: 99.08333333333333
    	},
    	{
    		state: "GA",
    		county: "McDuffie County",
    		avgInfected: 63.583333333333336
    	},
    	{
    		state: "GA",
    		county: "McIntosh County",
    		avgInfected: 28.083333333333332
    	},
    	{
    		state: "GA",
    		county: "Macon County",
    		avgInfected: 23.333333333333332
    	},
    	{
    		state: "GA",
    		county: "Madison County",
    		avgInfected: 77.58333333333333
    	},
    	{
    		state: "GA",
    		county: "Marion County",
    		avgInfected: 17.833333333333332
    	},
    	{
    		state: "GA",
    		county: "Meriwether County",
    		avgInfected: 51.916666666666664
    	},
    	{
    		state: "GA",
    		county: "Miller County",
    		avgInfected: 28.583333333333332
    	},
    	{
    		state: "GA",
    		county: "Mitchell County",
    		avgInfected: 73.16666666666667
    	},
    	{
    		state: "GA",
    		county: "Monroe County",
    		avgInfected: 71.58333333333333
    	},
    	{
    		state: "GA",
    		county: "Montgomery County",
    		avgInfected: 32
    	},
    	{
    		state: "GA",
    		county: "Morgan County",
    		avgInfected: 47.25
    	},
    	{
    		state: "GA",
    		county: "Murray County",
    		avgInfected: 123.91666666666667
    	},
    	{
    		state: "GA",
    		county: "Muscogee County",
    		avgInfected: 559.5
    	},
    	{
    		state: "GA",
    		county: "Newton County",
    		avgInfected: 266.6666666666667
    	},
    	{
    		state: "GA",
    		county: "Oconee County",
    		avgInfected: 79.91666666666667
    	},
    	{
    		state: "GA",
    		county: "Oglethorpe County",
    		avgInfected: 38.75
    	},
    	{
    		state: "GA",
    		county: "Paulding County",
    		avgInfected: 309.5833333333333
    	},
    	{
    		state: "GA",
    		county: "Peach County",
    		avgInfected: 73.75
    	},
    	{
    		state: "GA",
    		county: "Pickens County",
    		avgInfected: 80.66666666666667
    	},
    	{
    		state: "GA",
    		county: "Pierce County",
    		avgInfected: 60.416666666666664
    	},
    	{
    		state: "GA",
    		county: "Pike County",
    		avgInfected: 35.833333333333336
    	},
    	{
    		state: "GA",
    		county: "Polk County",
    		avgInfected: 160
    	},
    	{
    		state: "GA",
    		county: "Pulaski County",
    		avgInfected: 30.416666666666668
    	},
    	{
    		state: "GA",
    		county: "Putnam County",
    		avgInfected: 73
    	},
    	{
    		state: "GA",
    		county: "Quitman County",
    		avgInfected: 3.6666666666666665
    	},
    	{
    		state: "GA",
    		county: "Rabun County",
    		avgInfected: 43.583333333333336
    	},
    	{
    		state: "GA",
    		county: "Randolph County",
    		avgInfected: 28.666666666666668
    	},
    	{
    		state: "GA",
    		county: "Richmond County",
    		avgInfected: 747.9166666666666
    	},
    	{
    		state: "GA",
    		county: "Rockdale County",
    		avgInfected: 200.33333333333334
    	},
    	{
    		state: "GA",
    		county: "Schley County",
    		avgInfected: 9.916666666666666
    	},
    	{
    		state: "GA",
    		county: "Screven County",
    		avgInfected: 38.583333333333336
    	},
    	{
    		state: "GA",
    		county: "Seminole County",
    		avgInfected: 37.583333333333336
    	},
    	{
    		state: "GA",
    		county: "Spalding County",
    		avgInfected: 150.33333333333334
    	},
    	{
    		state: "GA",
    		county: "Stephens County",
    		avgInfected: 116.25
    	},
    	{
    		state: "GA",
    		county: "Stewart County",
    		avgInfected: 47.333333333333336
    	},
    	{
    		state: "GA",
    		county: "Sumter County",
    		avgInfected: 82.75
    	},
    	{
    		state: "GA",
    		county: "Talbot County",
    		avgInfected: 16.5
    	},
    	{
    		state: "GA",
    		county: "Taliaferro County",
    		avgInfected: 2.75
    	},
    	{
    		state: "GA",
    		county: "Tattnall County",
    		avgInfected: 82.58333333333333
    	},
    	{
    		state: "GA",
    		county: "Taylor County",
    		avgInfected: 21.333333333333332
    	},
    	{
    		state: "GA",
    		county: "Telfair County",
    		avgInfected: 42.75
    	},
    	{
    		state: "GA",
    		county: "Terrell County",
    		avgInfected: 28.833333333333332
    	},
    	{
    		state: "GA",
    		county: "Thomas County",
    		avgInfected: 140.83333333333334
    	},
    	{
    		state: "GA",
    		county: "Tift County",
    		avgInfected: 177.41666666666666
    	},
    	{
    		state: "GA",
    		county: "Toombs County",
    		avgInfected: 133.16666666666666
    	},
    	{
    		state: "GA",
    		county: "Towns County",
    		avgInfected: 43.333333333333336
    	},
    	{
    		state: "GA",
    		county: "Treutlen County",
    		avgInfected: 27.25
    	},
    	{
    		state: "GA",
    		county: "Troup County",
    		avgInfected: 268.0833333333333
    	},
    	{
    		state: "GA",
    		county: "Turner County",
    		avgInfected: 30
    	},
    	{
    		state: "GA",
    		county: "Twiggs County",
    		avgInfected: 20
    	},
    	{
    		state: "GA",
    		county: "Union County",
    		avgInfected: 84.5
    	},
    	{
    		state: "GA",
    		county: "Upson County",
    		avgInfected: 74.75
    	},
    	{
    		state: "GA",
    		county: "Walker County",
    		avgInfected: 194.33333333333334
    	},
    	{
    		state: "GA",
    		county: "Walton County",
    		avgInfected: 219.08333333333334
    	},
    	{
    		state: "GA",
    		county: "Ware County",
    		avgInfected: 155.16666666666666
    	},
    	{
    		state: "GA",
    		county: "Warren County",
    		avgInfected: 15
    	},
    	{
    		state: "GA",
    		county: "Washington County",
    		avgInfected: 77.08333333333333
    	},
    	{
    		state: "GA",
    		county: "Wayne County",
    		avgInfected: 112.16666666666667
    	},
    	{
    		state: "GA",
    		county: "Webster County",
    		avgInfected: 3.8333333333333335
    	},
    	{
    		state: "GA",
    		county: "Wheeler County",
    		avgInfected: 30.833333333333332
    	},
    	{
    		state: "GA",
    		county: "White County",
    		avgInfected: 97.91666666666667
    	},
    	{
    		state: "GA",
    		county: "Whitfield County",
    		avgInfected: 577.1666666666666
    	},
    	{
    		state: "GA",
    		county: "Wilcox County",
    		avgInfected: 22.5
    	},
    	{
    		state: "GA",
    		county: "Wilkes County",
    		avgInfected: 29.5
    	},
    	{
    		state: "GA",
    		county: "Wilkinson County",
    		avgInfected: 33.5
    	},
    	{
    		state: "GA",
    		county: "Worth County",
    		avgInfected: 51.833333333333336
    	},
    	{
    		state: "HI",
    		county: "Statewide Unallocated",
    		avgInfected: 13.666666666666666
    	},
    	{
    		state: "HI",
    		county: "Hawaii County",
    		avgInfected: 124.91666666666667
    	},
    	{
    		state: "HI",
    		county: "Honolulu County",
    		avgInfected: 1208.8333333333333
    	},
    	{
    		state: "HI",
    		county: "Kalawao County",
    		avgInfected: 0
    	},
    	{
    		state: "HI",
    		county: "Kauai County",
    		avgInfected: 7.166666666666667
    	},
    	{
    		state: "HI",
    		county: "Maui County",
    		avgInfected: 48.833333333333336
    	},
    	{
    		state: "ID",
    		county: "Statewide Unallocated",
    		avgInfected: 0.08333333333333333
    	},
    	{
    		state: "ID",
    		county: "Ada County",
    		avgInfected: 1882.5
    	},
    	{
    		state: "ID",
    		county: "Adams County",
    		avgInfected: 7.333333333333333
    	},
    	{
    		state: "ID",
    		county: "Bannock County",
    		avgInfected: 308.1666666666667
    	},
    	{
    		state: "ID",
    		county: "Bear Lake County",
    		avgInfected: 12.916666666666666
    	},
    	{
    		state: "ID",
    		county: "Benewah County",
    		avgInfected: 19.416666666666668
    	},
    	{
    		state: "ID",
    		county: "Bingham County",
    		avgInfected: 194.16666666666666
    	},
    	{
    		state: "ID",
    		county: "Blaine County",
    		avgInfected: 97.16666666666667
    	},
    	{
    		state: "ID",
    		county: "Boise County",
    		avgInfected: 9.916666666666666
    	},
    	{
    		state: "ID",
    		county: "Bonner County",
    		avgInfected: 67.41666666666667
    	},
    	{
    		state: "ID",
    		county: "Bonneville County",
    		avgInfected: 542.9166666666666
    	},
    	{
    		state: "ID",
    		county: "Boundary County",
    		avgInfected: 26.333333333333332
    	},
    	{
    		state: "ID",
    		county: "Butte County",
    		avgInfected: 9.75
    	},
    	{
    		state: "ID",
    		county: "Camas County",
    		avgInfected: 4.25
    	},
    	{
    		state: "ID",
    		county: "Canyon County",
    		avgInfected: 1103.6666666666667
    	},
    	{
    		state: "ID",
    		county: "Caribou County",
    		avgInfected: 33.75
    	},
    	{
    		state: "ID",
    		county: "Cassia County",
    		avgInfected: 162.91666666666666
    	},
    	{
    		state: "ID",
    		county: "Clark County",
    		avgInfected: 3.9166666666666665
    	},
    	{
    		state: "ID",
    		county: "Clearwater County",
    		avgInfected: 27.833333333333332
    	},
    	{
    		state: "ID",
    		county: "Custer County",
    		avgInfected: 10.833333333333334
    	},
    	{
    		state: "ID",
    		county: "Elmore County",
    		avgInfected: 65.41666666666667
    	},
    	{
    		state: "ID",
    		county: "Franklin County",
    		avgInfected: 45.916666666666664
    	},
    	{
    		state: "ID",
    		county: "Fremont County",
    		avgInfected: 53.25
    	},
    	{
    		state: "ID",
    		county: "Gem County",
    		avgInfected: 58.25
    	},
    	{
    		state: "ID",
    		county: "Gooding County",
    		avgInfected: 72.75
    	},
    	{
    		state: "ID",
    		county: "Idaho County",
    		avgInfected: 52.75
    	},
    	{
    		state: "ID",
    		county: "Jefferson County",
    		avgInfected: 112.41666666666667
    	},
    	{
    		state: "ID",
    		county: "Jerome County",
    		avgInfected: 143.25
    	},
    	{
    		state: "ID",
    		county: "Kootenai County",
    		avgInfected: 529.3333333333334
    	},
    	{
    		state: "ID",
    		county: "Latah County",
    		avgInfected: 127.08333333333333
    	},
    	{
    		state: "ID",
    		county: "Lemhi County",
    		avgInfected: 34.083333333333336
    	},
    	{
    		state: "ID",
    		county: "Lewis County",
    		avgInfected: 13.75
    	},
    	{
    		state: "ID",
    		county: "Lincoln County",
    		avgInfected: 27.166666666666668
    	},
    	{
    		state: "ID",
    		county: "Madison County",
    		avgInfected: 301.5
    	},
    	{
    		state: "ID",
    		county: "Minidoka County",
    		avgInfected: 133.25
    	},
    	{
    		state: "ID",
    		county: "Nez Perce County",
    		avgInfected: 163.75
    	},
    	{
    		state: "ID",
    		county: "Oneida County",
    		avgInfected: 9.416666666666666
    	},
    	{
    		state: "ID",
    		county: "Owyhee County",
    		avgInfected: 44.75
    	},
    	{
    		state: "ID",
    		county: "Payette County",
    		avgInfected: 119.16666666666667
    	},
    	{
    		state: "ID",
    		county: "Power County",
    		avgInfected: 35.75
    	},
    	{
    		state: "ID",
    		county: "Shoshone County",
    		avgInfected: 36.416666666666664
    	},
    	{
    		state: "ID",
    		county: "Teton County",
    		avgInfected: 39
    	},
    	{
    		state: "ID",
    		county: "Twin Falls County",
    		avgInfected: 517.4166666666666
    	},
    	{
    		state: "ID",
    		county: "Valley County",
    		avgInfected: 17.083333333333332
    	},
    	{
    		state: "ID",
    		county: "Washington County",
    		avgInfected: 53.333333333333336
    	},
    	{
    		state: "IL",
    		county: "Statewide Unallocated",
    		avgInfected: 23.416666666666668
    	},
    	{
    		state: "IL",
    		county: "Adams County",
    		avgInfected: 342
    	},
    	{
    		state: "IL",
    		county: "Alexander County",
    		avgInfected: 18.833333333333332
    	},
    	{
    		state: "IL",
    		county: "Bond County",
    		avgInfected: 72.91666666666667
    	},
    	{
    		state: "IL",
    		county: "Boone County",
    		avgInfected: 280.4166666666667
    	},
    	{
    		state: "IL",
    		county: "Brown County",
    		avgInfected: 21.666666666666668
    	},
    	{
    		state: "IL",
    		county: "Bureau County",
    		avgInfected: 151.75
    	},
    	{
    		state: "IL",
    		county: "Calhoun County",
    		avgInfected: 16.166666666666668
    	},
    	{
    		state: "IL",
    		county: "Carroll County",
    		avgInfected: 78.41666666666667
    	},
    	{
    		state: "IL",
    		county: "Cass County",
    		avgInfected: 67.08333333333333
    	},
    	{
    		state: "IL",
    		county: "Champaign County",
    		avgInfected: 804.0833333333334
    	},
    	{
    		state: "IL",
    		county: "Christian County",
    		avgInfected: 135.91666666666666
    	},
    	{
    		state: "IL",
    		county: "Clark County",
    		avgInfected: 55.333333333333336
    	},
    	{
    		state: "IL",
    		county: "Clay County",
    		avgInfected: 55.583333333333336
    	},
    	{
    		state: "IL",
    		county: "Clinton County",
    		avgInfected: 232
    	},
    	{
    		state: "IL",
    		county: "Coles County",
    		avgInfected: 248.75
    	},
    	{
    		state: "IL",
    		county: "Cook County",
    		avgInfected: 22357
    	},
    	{
    		state: "IL",
    		county: "Crawford County",
    		avgInfected: 79
    	},
    	{
    		state: "IL",
    		county: "Cumberland County",
    		avgInfected: 43
    	},
    	{
    		state: "IL",
    		county: "DeKalb County",
    		avgInfected: 359.9166666666667
    	},
    	{
    		state: "IL",
    		county: "De Witt County",
    		avgInfected: 45.166666666666664
    	},
    	{
    		state: "IL",
    		county: "Douglas County",
    		avgInfected: 99.75
    	},
    	{
    		state: "IL",
    		county: "DuPage County",
    		avgInfected: 3222.5
    	},
    	{
    		state: "IL",
    		county: "Edgar County",
    		avgInfected: 53.416666666666664
    	},
    	{
    		state: "IL",
    		county: "Edwards County",
    		avgInfected: 15.416666666666666
    	},
    	{
    		state: "IL",
    		county: "Effingham County",
    		avgInfected: 188.91666666666666
    	},
    	{
    		state: "IL",
    		county: "Fayette County",
    		avgInfected: 112.25
    	},
    	{
    		state: "IL",
    		county: "Ford County",
    		avgInfected: 50.416666666666664
    	},
    	{
    		state: "IL",
    		county: "Franklin County",
    		avgInfected: 146.41666666666666
    	},
    	{
    		state: "IL",
    		county: "Fulton County",
    		avgInfected: 94.75
    	},
    	{
    		state: "IL",
    		county: "Gallatin County",
    		avgInfected: 14.083333333333334
    	},
    	{
    		state: "IL",
    		county: "Greene County",
    		avgInfected: 57.666666666666664
    	},
    	{
    		state: "IL",
    		county: "Grundy County",
    		avgInfected: 188.66666666666666
    	},
    	{
    		state: "IL",
    		county: "Hamilton County",
    		avgInfected: 27.083333333333332
    	},
    	{
    		state: "IL",
    		county: "Hancock County",
    		avgInfected: 70
    	},
    	{
    		state: "IL",
    		county: "Hardin County",
    		avgInfected: 8.75
    	},
    	{
    		state: "IL",
    		county: "Henderson County",
    		avgInfected: 20.083333333333332
    	},
    	{
    		state: "IL",
    		county: "Henry County",
    		avgInfected: 174.33333333333334
    	},
    	{
    		state: "IL",
    		county: "Iroquois County",
    		avgInfected: 113.33333333333333
    	},
    	{
    		state: "IL",
    		county: "Jackson County",
    		avgInfected: 192.83333333333334
    	},
    	{
    		state: "IL",
    		county: "Jasper County",
    		avgInfected: 45.5
    	},
    	{
    		state: "IL",
    		county: "Jefferson County",
    		avgInfected: 130.16666666666666
    	},
    	{
    		state: "IL",
    		county: "Jersey County",
    		avgInfected: 85
    	},
    	{
    		state: "IL",
    		county: "Jo Daviess County",
    		avgInfected: 77.75
    	},
    	{
    		state: "IL",
    		county: "Johnson County",
    		avgInfected: 51.083333333333336
    	},
    	{
    		state: "IL",
    		county: "Kane County",
    		avgInfected: 2305.25
    	},
    	{
    		state: "IL",
    		county: "Kankakee County",
    		avgInfected: 597.9166666666666
    	},
    	{
    		state: "IL",
    		county: "Kendall County",
    		avgInfected: 441.5
    	},
    	{
    		state: "IL",
    		county: "Knox County",
    		avgInfected: 191.75
    	},
    	{
    		state: "IL",
    		county: "Lake County",
    		avgInfected: 2735.4166666666665
    	},
    	{
    		state: "IL",
    		county: "LaSalle County",
    		avgInfected: 432.25
    	},
    	{
    		state: "IL",
    		county: "Lawrence County",
    		avgInfected: 59.333333333333336
    	},
    	{
    		state: "IL",
    		county: "Lee County",
    		avgInfected: 130.33333333333334
    	},
    	{
    		state: "IL",
    		county: "Livingston County",
    		avgInfected: 155.25
    	},
    	{
    		state: "IL",
    		county: "Logan County",
    		avgInfected: 109.5
    	},
    	{
    		state: "IL",
    		county: "McDonough County",
    		avgInfected: 116.58333333333333
    	},
    	{
    		state: "IL",
    		county: "McHenry County",
    		avgInfected: 1016.1666666666666
    	},
    	{
    		state: "IL",
    		county: "McLean County",
    		avgInfected: 604.8333333333334
    	},
    	{
    		state: "IL",
    		county: "Macon County",
    		avgInfected: 472.5
    	},
    	{
    		state: "IL",
    		county: "Macoupin County",
    		avgInfected: 146.83333333333334
    	},
    	{
    		state: "IL",
    		county: "Madison County",
    		avgInfected: 1002.6666666666666
    	},
    	{
    		state: "IL",
    		county: "Marion County",
    		avgInfected: 167.66666666666666
    	},
    	{
    		state: "IL",
    		county: "Marshall County",
    		avgInfected: 25.583333333333332
    	},
    	{
    		state: "IL",
    		county: "Mason County",
    		avgInfected: 46.083333333333336
    	},
    	{
    		state: "IL",
    		county: "Massac County",
    		avgInfected: 32
    	},
    	{
    		state: "IL",
    		county: "Menard County",
    		avgInfected: 29.666666666666668
    	},
    	{
    		state: "IL",
    		county: "Mercer County",
    		avgInfected: 50.916666666666664
    	},
    	{
    		state: "IL",
    		county: "Monroe County",
    		avgInfected: 140.33333333333334
    	},
    	{
    		state: "IL",
    		county: "Montgomery County",
    		avgInfected: 82.75
    	},
    	{
    		state: "IL",
    		county: "Morgan County",
    		avgInfected: 152.5
    	},
    	{
    		state: "IL",
    		county: "Moultrie County",
    		avgInfected: 62.75
    	},
    	{
    		state: "IL",
    		county: "Ogle County",
    		avgInfected: 200.66666666666666
    	},
    	{
    		state: "IL",
    		county: "Peoria County",
    		avgInfected: 637.6666666666666
    	},
    	{
    		state: "IL",
    		county: "Perry County",
    		avgInfected: 71
    	},
    	{
    		state: "IL",
    		county: "Piatt County",
    		avgInfected: 54.5
    	},
    	{
    		state: "IL",
    		county: "Pike County",
    		avgInfected: 73.58333333333333
    	},
    	{
    		state: "IL",
    		county: "Pope County",
    		avgInfected: 5.5
    	},
    	{
    		state: "IL",
    		county: "Pulaski County",
    		avgInfected: 28.333333333333332
    	},
    	{
    		state: "IL",
    		county: "Putnam County",
    		avgInfected: 16.416666666666668
    	},
    	{
    		state: "IL",
    		county: "Randolph County",
    		avgInfected: 158.83333333333334
    	},
    	{
    		state: "IL",
    		county: "Richland County",
    		avgInfected: 48.583333333333336
    	},
    	{
    		state: "IL",
    		county: "Rock Island County",
    		avgInfected: 609.1666666666666
    	},
    	{
    		state: "IL",
    		county: "St. Clair County",
    		avgInfected: 932.5833333333334
    	},
    	{
    		state: "IL",
    		county: "Saline County",
    		avgInfected: 80.33333333333333
    	},
    	{
    		state: "IL",
    		county: "Sangamon County",
    		avgInfected: 698
    	},
    	{
    		state: "IL",
    		county: "Schuyler County",
    		avgInfected: 16.583333333333332
    	},
    	{
    		state: "IL",
    		county: "Scott County",
    		avgInfected: 16.916666666666668
    	},
    	{
    		state: "IL",
    		county: "Shelby County",
    		avgInfected: 94.66666666666667
    	},
    	{
    		state: "IL",
    		county: "Stark County",
    		avgInfected: 15.083333333333334
    	},
    	{
    		state: "IL",
    		county: "Stephenson County",
    		avgInfected: 178.83333333333334
    	},
    	{
    		state: "IL",
    		county: "Tazewell County",
    		avgInfected: 447.9166666666667
    	},
    	{
    		state: "IL",
    		county: "Union County",
    		avgInfected: 86.66666666666667
    	},
    	{
    		state: "IL",
    		county: "Vermilion County",
    		avgInfected: 262.3333333333333
    	},
    	{
    		state: "IL",
    		county: "Wabash County",
    		avgInfected: 35.333333333333336
    	},
    	{
    		state: "IL",
    		county: "Warren County",
    		avgInfected: 74.58333333333333
    	},
    	{
    		state: "IL",
    		county: "Washington County",
    		avgInfected: 45.833333333333336
    	},
    	{
    		state: "IL",
    		county: "Wayne County",
    		avgInfected: 64.08333333333333
    	},
    	{
    		state: "IL",
    		county: "White County",
    		avgInfected: 39.5
    	},
    	{
    		state: "IL",
    		county: "Whiteside County",
    		avgInfected: 266.25
    	},
    	{
    		state: "IL",
    		county: "Will County",
    		avgInfected: 2734.8333333333335
    	},
    	{
    		state: "IL",
    		county: "Williamson County",
    		avgInfected: 255.25
    	},
    	{
    		state: "IL",
    		county: "Winnebago County",
    		avgInfected: 1377.3333333333333
    	},
    	{
    		state: "IL",
    		county: "Woodford County",
    		avgInfected: 116.5
    	},
    	{
    		state: "IN",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "IN",
    		county: "Adams County",
    		avgInfected: 147.58333333333334
    	},
    	{
    		state: "IN",
    		county: "Allen County",
    		avgInfected: 1320.75
    	},
    	{
    		state: "IN",
    		county: "Bartholomew County",
    		avgInfected: 223.83333333333334
    	},
    	{
    		state: "IN",
    		county: "Benton County",
    		avgInfected: 24.333333333333332
    	},
    	{
    		state: "IN",
    		county: "Blackford County",
    		avgInfected: 36.75
    	},
    	{
    		state: "IN",
    		county: "Boone County",
    		avgInfected: 180.83333333333334
    	},
    	{
    		state: "IN",
    		county: "Brown County",
    		avgInfected: 25
    	},
    	{
    		state: "IN",
    		county: "Carroll County",
    		avgInfected: 51.25
    	},
    	{
    		state: "IN",
    		county: "Cass County",
    		avgInfected: 235.91666666666666
    	},
    	{
    		state: "IN",
    		county: "Clark County",
    		avgInfected: 379.9166666666667
    	},
    	{
    		state: "IN",
    		county: "Clay County",
    		avgInfected: 79.83333333333333
    	},
    	{
    		state: "IN",
    		county: "Clinton County",
    		avgInfected: 133.33333333333334
    	},
    	{
    		state: "IN",
    		county: "Crawford County",
    		avgInfected: 20.916666666666668
    	},
    	{
    		state: "IN",
    		county: "Daviess County",
    		avgInfected: 112.66666666666667
    	},
    	{
    		state: "IN",
    		county: "Dearborn County",
    		avgInfected: 158
    	},
    	{
    		state: "IN",
    		county: "Decatur County",
    		avgInfected: 96.66666666666667
    	},
    	{
    		state: "IN",
    		county: "DeKalb County",
    		avgInfected: 130.75
    	},
    	{
    		state: "IN",
    		county: "Delaware County",
    		avgInfected: 369.5833333333333
    	},
    	{
    		state: "IN",
    		county: "Dubois County",
    		avgInfected: 182.08333333333334
    	},
    	{
    		state: "IN",
    		county: "Elkhart County",
    		avgInfected: 1295.8333333333333
    	},
    	{
    		state: "IN",
    		county: "Fayette County",
    		avgInfected: 122.25
    	},
    	{
    		state: "IN",
    		county: "Floyd County",
    		avgInfected: 235.91666666666666
    	},
    	{
    		state: "IN",
    		county: "Fountain County",
    		avgInfected: 55.166666666666664
    	},
    	{
    		state: "IN",
    		county: "Franklin County",
    		avgInfected: 50.25
    	},
    	{
    		state: "IN",
    		county: "Fulton County",
    		avgInfected: 62.083333333333336
    	},
    	{
    		state: "IN",
    		county: "Gibson County",
    		avgInfected: 133.25
    	},
    	{
    		state: "IN",
    		county: "Grant County",
    		avgInfected: 224.5
    	},
    	{
    		state: "IN",
    		county: "Greene County",
    		avgInfected: 77.91666666666667
    	},
    	{
    		state: "IN",
    		county: "Hamilton County",
    		avgInfected: 942.25
    	},
    	{
    		state: "IN",
    		county: "Hancock County",
    		avgInfected: 186.33333333333334
    	},
    	{
    		state: "IN",
    		county: "Harrison County",
    		avgInfected: 105.08333333333333
    	},
    	{
    		state: "IN",
    		county: "Hendricks County",
    		avgInfected: 442.8333333333333
    	},
    	{
    		state: "IN",
    		county: "Henry County",
    		avgInfected: 183.25
    	},
    	{
    		state: "IN",
    		county: "Howard County",
    		avgInfected: 241.75
    	},
    	{
    		state: "IN",
    		county: "Huntington County",
    		avgInfected: 85.41666666666667
    	},
    	{
    		state: "IN",
    		county: "Jackson County",
    		avgInfected: 156.75
    	},
    	{
    		state: "IN",
    		county: "Jasper County",
    		avgInfected: 103.33333333333333
    	},
    	{
    		state: "IN",
    		county: "Jay County",
    		avgInfected: 70.91666666666667
    	},
    	{
    		state: "IN",
    		county: "Jefferson County",
    		avgInfected: 83.83333333333333
    	},
    	{
    		state: "IN",
    		county: "Jennings County",
    		avgInfected: 62.5
    	},
    	{
    		state: "IN",
    		county: "Johnson County",
    		avgInfected: 464.25
    	},
    	{
    		state: "IN",
    		county: "Knox County",
    		avgInfected: 132.16666666666666
    	},
    	{
    		state: "IN",
    		county: "Kosciusko County",
    		avgInfected: 331.1666666666667
    	},
    	{
    		state: "IN",
    		county: "LaGrange County",
    		avgInfected: 107.41666666666667
    	},
    	{
    		state: "IN",
    		county: "Lake County",
    		avgInfected: 2047.4166666666667
    	},
    	{
    		state: "IN",
    		county: "LaPorte County",
    		avgInfected: 340.5
    	},
    	{
    		state: "IN",
    		county: "Lawrence County",
    		avgInfected: 134.08333333333334
    	},
    	{
    		state: "IN",
    		county: "Madison County",
    		avgInfected: 359.4166666666667
    	},
    	{
    		state: "IN",
    		county: "Marion County",
    		avgInfected: 3208.4166666666665
    	},
    	{
    		state: "IN",
    		county: "Marshall County",
    		avgInfected: 224.66666666666666
    	},
    	{
    		state: "IN",
    		county: "Martin County",
    		avgInfected: 26.75
    	},
    	{
    		state: "IN",
    		county: "Miami County",
    		avgInfected: 113.75
    	},
    	{
    		state: "IN",
    		county: "Monroe County",
    		avgInfected: 401.8333333333333
    	},
    	{
    		state: "IN",
    		county: "Montgomery County",
    		avgInfected: 99.5
    	},
    	{
    		state: "IN",
    		county: "Morgan County",
    		avgInfected: 153.75
    	},
    	{
    		state: "IN",
    		county: "Newton County",
    		avgInfected: 42.416666666666664
    	},
    	{
    		state: "IN",
    		county: "Noble County",
    		avgInfected: 189.33333333333334
    	},
    	{
    		state: "IN",
    		county: "Ohio County",
    		avgInfected: 17.75
    	},
    	{
    		state: "IN",
    		county: "Orange County",
    		avgInfected: 51.666666666666664
    	},
    	{
    		state: "IN",
    		county: "Owen County",
    		avgInfected: 42.916666666666664
    	},
    	{
    		state: "IN",
    		county: "Parke County",
    		avgInfected: 40.75
    	},
    	{
    		state: "IN",
    		county: "Perry County",
    		avgInfected: 65.41666666666667
    	},
    	{
    		state: "IN",
    		county: "Pike County",
    		avgInfected: 40
    	},
    	{
    		state: "IN",
    		county: "Porter County",
    		avgInfected: 601.5833333333334
    	},
    	{
    		state: "IN",
    		county: "Posey County",
    		avgInfected: 92.33333333333333
    	},
    	{
    		state: "IN",
    		county: "Pulaski County",
    		avgInfected: 28.75
    	},
    	{
    		state: "IN",
    		county: "Putnam County",
    		avgInfected: 91.41666666666667
    	},
    	{
    		state: "IN",
    		county: "Randolph County",
    		avgInfected: 90.33333333333333
    	},
    	{
    		state: "IN",
    		county: "Ripley County",
    		avgInfected: 90.83333333333333
    	},
    	{
    		state: "IN",
    		county: "Rush County",
    		avgInfected: 43.333333333333336
    	},
    	{
    		state: "IN",
    		county: "St. Joseph County",
    		avgInfected: 1272
    	},
    	{
    		state: "IN",
    		county: "Scott County",
    		avgInfected: 73.58333333333333
    	},
    	{
    		state: "IN",
    		county: "Shelby County",
    		avgInfected: 182.41666666666666
    	},
    	{
    		state: "IN",
    		county: "Spencer County",
    		avgInfected: 61.083333333333336
    	},
    	{
    		state: "IN",
    		county: "Starke County",
    		avgInfected: 68.91666666666667
    	},
    	{
    		state: "IN",
    		county: "Steuben County",
    		avgInfected: 105.66666666666667
    	},
    	{
    		state: "IN",
    		county: "Sullivan County",
    		avgInfected: 63.666666666666664
    	},
    	{
    		state: "IN",
    		county: "Switzerland County",
    		avgInfected: 19.416666666666668
    	},
    	{
    		state: "IN",
    		county: "Tippecanoe County",
    		avgInfected: 618.1666666666666
    	},
    	{
    		state: "IN",
    		county: "Tipton County",
    		avgInfected: 40.833333333333336
    	},
    	{
    		state: "IN",
    		county: "Union County",
    		avgInfected: 22.25
    	},
    	{
    		state: "IN",
    		county: "Vanderburgh County",
    		avgInfected: 730.5
    	},
    	{
    		state: "IN",
    		county: "Vermillion County",
    		avgInfected: 42.25
    	},
    	{
    		state: "IN",
    		county: "Vigo County",
    		avgInfected: 440
    	},
    	{
    		state: "IN",
    		county: "Wabash County",
    		avgInfected: 109.33333333333333
    	},
    	{
    		state: "IN",
    		county: "Warren County",
    		avgInfected: 16.916666666666668
    	},
    	{
    		state: "IN",
    		county: "Warrick County",
    		avgInfected: 244.91666666666666
    	},
    	{
    		state: "IN",
    		county: "Washington County",
    		avgInfected: 51.666666666666664
    	},
    	{
    		state: "IN",
    		county: "Wayne County",
    		avgInfected: 256
    	},
    	{
    		state: "IN",
    		county: "Wells County",
    		avgInfected: 91.33333333333333
    	},
    	{
    		state: "IN",
    		county: "White County",
    		avgInfected: 89.75
    	},
    	{
    		state: "IN",
    		county: "Whitley County",
    		avgInfected: 96.5
    	},
    	{
    		state: "IA",
    		county: "Statewide Unallocated",
    		avgInfected: 41.833333333333336
    	},
    	{
    		state: "IA",
    		county: "Adair County",
    		avgInfected: 31.5
    	},
    	{
    		state: "IA",
    		county: "Adams County",
    		avgInfected: 12
    	},
    	{
    		state: "IA",
    		county: "Allamakee County",
    		avgInfected: 55.333333333333336
    	},
    	{
    		state: "IA",
    		county: "Appanoose County",
    		avgInfected: 55.5
    	},
    	{
    		state: "IA",
    		county: "Audubon County",
    		avgInfected: 22.5
    	},
    	{
    		state: "IA",
    		county: "Benton County",
    		avgInfected: 121.75
    	},
    	{
    		state: "IA",
    		county: "Black Hawk County",
    		avgInfected: 802
    	},
    	{
    		state: "IA",
    		county: "Boone County",
    		avgInfected: 98.83333333333333
    	},
    	{
    		state: "IA",
    		county: "Bremer County",
    		avgInfected: 135
    	},
    	{
    		state: "IA",
    		county: "Buchanan County",
    		avgInfected: 83.16666666666667
    	},
    	{
    		state: "IA",
    		county: "Buena Vista County",
    		avgInfected: 232.83333333333334
    	},
    	{
    		state: "IA",
    		county: "Butler County",
    		avgInfected: 69.16666666666667
    	},
    	{
    		state: "IA",
    		county: "Calhoun County",
    		avgInfected: 77.41666666666667
    	},
    	{
    		state: "IA",
    		county: "Carroll County",
    		avgInfected: 149.66666666666666
    	},
    	{
    		state: "IA",
    		county: "Cass County",
    		avgInfected: 56.666666666666664
    	},
    	{
    		state: "IA",
    		county: "Cedar County",
    		avgInfected: 75.91666666666667
    	},
    	{
    		state: "IA",
    		county: "Cerro Gordo County",
    		avgInfected: 248.66666666666666
    	},
    	{
    		state: "IA",
    		county: "Cherokee County",
    		avgInfected: 57.416666666666664
    	},
    	{
    		state: "IA",
    		county: "Chickasaw County",
    		avgInfected: 58.583333333333336
    	},
    	{
    		state: "IA",
    		county: "Clarke County",
    		avgInfected: 37.166666666666664
    	},
    	{
    		state: "IA",
    		county: "Clay County",
    		avgInfected: 80
    	},
    	{
    		state: "IA",
    		county: "Clayton County",
    		avgInfected: 76.66666666666667
    	},
    	{
    		state: "IA",
    		county: "Clinton County",
    		avgInfected: 234.41666666666666
    	},
    	{
    		state: "IA",
    		county: "Crawford County",
    		avgInfected: 137.08333333333334
    	},
    	{
    		state: "IA",
    		county: "Dallas County",
    		avgInfected: 466.0833333333333
    	},
    	{
    		state: "IA",
    		county: "Davis County",
    		avgInfected: 32.416666666666664
    	},
    	{
    		state: "IA",
    		county: "Decatur County",
    		avgInfected: 23.5
    	},
    	{
    		state: "IA",
    		county: "Delaware County",
    		avgInfected: 106.58333333333333
    	},
    	{
    		state: "IA",
    		county: "Des Moines County",
    		avgInfected: 209.16666666666666
    	},
    	{
    		state: "IA",
    		county: "Dickinson County",
    		avgInfected: 98.5
    	},
    	{
    		state: "IA",
    		county: "Dubuque County",
    		avgInfected: 689
    	},
    	{
    		state: "IA",
    		county: "Emmet County",
    		avgInfected: 54.75
    	},
    	{
    		state: "IA",
    		county: "Fayette County",
    		avgInfected: 73.91666666666667
    	},
    	{
    		state: "IA",
    		county: "Floyd County",
    		avgInfected: 70.08333333333333
    	},
    	{
    		state: "IA",
    		county: "Franklin County",
    		avgInfected: 53.416666666666664
    	},
    	{
    		state: "IA",
    		county: "Fremont County",
    		avgInfected: 26.75
    	},
    	{
    		state: "IA",
    		county: "Greene County",
    		avgInfected: 37.166666666666664
    	},
    	{
    		state: "IA",
    		county: "Grundy County",
    		avgInfected: 59.333333333333336
    	},
    	{
    		state: "IA",
    		county: "Guthrie County",
    		avgInfected: 55.5
    	},
    	{
    		state: "IA",
    		county: "Hamilton County",
    		avgInfected: 73.75
    	},
    	{
    		state: "IA",
    		county: "Hancock County",
    		avgInfected: 61.666666666666664
    	},
    	{
    		state: "IA",
    		county: "Hardin County",
    		avgInfected: 81.25
    	},
    	{
    		state: "IA",
    		county: "Harrison County",
    		avgInfected: 79.33333333333333
    	},
    	{
    		state: "IA",
    		county: "Henry County",
    		avgInfected: 134.75
    	},
    	{
    		state: "IA",
    		county: "Howard County",
    		avgInfected: 38.333333333333336
    	},
    	{
    		state: "IA",
    		county: "Humboldt County",
    		avgInfected: 51.333333333333336
    	},
    	{
    		state: "IA",
    		county: "Ida County",
    		avgInfected: 34.333333333333336
    	},
    	{
    		state: "IA",
    		county: "Iowa County",
    		avgInfected: 67.41666666666667
    	},
    	{
    		state: "IA",
    		county: "Jackson County",
    		avgInfected: 106
    	},
    	{
    		state: "IA",
    		county: "Jasper County",
    		avgInfected: 160.33333333333334
    	},
    	{
    		state: "IA",
    		county: "Jefferson County",
    		avgInfected: 46.166666666666664
    	},
    	{
    		state: "IA",
    		county: "Johnson County",
    		avgInfected: 718.4166666666666
    	},
    	{
    		state: "IA",
    		county: "Jones County",
    		avgInfected: 172.08333333333334
    	},
    	{
    		state: "IA",
    		county: "Keokuk County",
    		avgInfected: 39.333333333333336
    	},
    	{
    		state: "IA",
    		county: "Kossuth County",
    		avgInfected: 71.91666666666667
    	},
    	{
    		state: "IA",
    		county: "Lee County",
    		avgInfected: 148.25
    	},
    	{
    		state: "IA",
    		county: "Linn County",
    		avgInfected: 1039.5833333333333
    	},
    	{
    		state: "IA",
    		county: "Louisa County",
    		avgInfected: 62.916666666666664
    	},
    	{
    		state: "IA",
    		county: "Lucas County",
    		avgInfected: 24.25
    	},
    	{
    		state: "IA",
    		county: "Lyon County",
    		avgInfected: 73.16666666666667
    	},
    	{
    		state: "IA",
    		county: "Madison County",
    		avgInfected: 49.916666666666664
    	},
    	{
    		state: "IA",
    		county: "Mahaska County",
    		avgInfected: 93.33333333333333
    	},
    	{
    		state: "IA",
    		county: "Marion County",
    		avgInfected: 148.08333333333334
    	},
    	{
    		state: "IA",
    		county: "Marshall County",
    		avgInfected: 259.9166666666667
    	},
    	{
    		state: "IA",
    		county: "Mills County",
    		avgInfected: 74.5
    	},
    	{
    		state: "IA",
    		county: "Mitchell County",
    		avgInfected: 55.166666666666664
    	},
    	{
    		state: "IA",
    		county: "Monona County",
    		avgInfected: 29.5
    	},
    	{
    		state: "IA",
    		county: "Monroe County",
    		avgInfected: 32.666666666666664
    	},
    	{
    		state: "IA",
    		county: "Montgomery County",
    		avgInfected: 32.916666666666664
    	},
    	{
    		state: "IA",
    		county: "Muscatine County",
    		avgInfected: 207.41666666666666
    	},
    	{
    		state: "IA",
    		county: "O'Brien County",
    		avgInfected: 95.25
    	},
    	{
    		state: "IA",
    		county: "Osceola County",
    		avgInfected: 38.916666666666664
    	},
    	{
    		state: "IA",
    		county: "Page County",
    		avgInfected: 86.5
    	},
    	{
    		state: "IA",
    		county: "Palo Alto County",
    		avgInfected: 47.333333333333336
    	},
    	{
    		state: "IA",
    		county: "Plymouth County",
    		avgInfected: 207.58333333333334
    	},
    	{
    		state: "IA",
    		county: "Pocahontas County",
    		avgInfected: 40.416666666666664
    	},
    	{
    		state: "IA",
    		county: "Polk County",
    		avgInfected: 2440.5833333333335
    	},
    	{
    		state: "IA",
    		county: "Pottawattamie County",
    		avgInfected: 438.6666666666667
    	},
    	{
    		state: "IA",
    		county: "Poweshiek County",
    		avgInfected: 71.5
    	},
    	{
    		state: "IA",
    		county: "Ringgold County",
    		avgInfected: 12.75
    	},
    	{
    		state: "IA",
    		county: "Sac County",
    		avgInfected: 59.916666666666664
    	},
    	{
    		state: "IA",
    		county: "Scott County",
    		avgInfected: 777.1666666666666
    	},
    	{
    		state: "IA",
    		county: "Shelby County",
    		avgInfected: 56.833333333333336
    	},
    	{
    		state: "IA",
    		county: "Sioux County",
    		avgInfected: 279.75
    	},
    	{
    		state: "IA",
    		county: "Story County",
    		avgInfected: 494
    	},
    	{
    		state: "IA",
    		county: "Tama County",
    		avgInfected: 115.91666666666667
    	},
    	{
    		state: "IA",
    		county: "Taylor County",
    		avgInfected: 32.916666666666664
    	},
    	{
    		state: "IA",
    		county: "Union County",
    		avgInfected: 51
    	},
    	{
    		state: "IA",
    		county: "Van Buren County",
    		avgInfected: 25.833333333333332
    	},
    	{
    		state: "IA",
    		county: "Wapello County",
    		avgInfected: 186.91666666666666
    	},
    	{
    		state: "IA",
    		county: "Warren County",
    		avgInfected: 194.75
    	},
    	{
    		state: "IA",
    		county: "Washington County",
    		avgInfected: 99.16666666666667
    	},
    	{
    		state: "IA",
    		county: "Wayne County",
    		avgInfected: 22.333333333333332
    	},
    	{
    		state: "IA",
    		county: "Webster County",
    		avgInfected: 260.1666666666667
    	},
    	{
    		state: "IA",
    		county: "Winnebago County",
    		avgInfected: 67.75
    	},
    	{
    		state: "IA",
    		county: "Winneshiek County",
    		avgInfected: 68.83333333333333
    	},
    	{
    		state: "IA",
    		county: "Woodbury County",
    		avgInfected: 792.4166666666666
    	},
    	{
    		state: "IA",
    		county: "Worth County",
    		avgInfected: 25
    	},
    	{
    		state: "IA",
    		county: "Wright County",
    		avgInfected: 90.75
    	},
    	{
    		state: "KS",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "KS",
    		county: "Allen County",
    		avgInfected: 23.583333333333332
    	},
    	{
    		state: "KS",
    		county: "Anderson County",
    		avgInfected: 27.416666666666668
    	},
    	{
    		state: "KS",
    		county: "Atchison County",
    		avgInfected: 61.333333333333336
    	},
    	{
    		state: "KS",
    		county: "Barber County",
    		avgInfected: 13.666666666666666
    	},
    	{
    		state: "KS",
    		county: "Barton County",
    		avgInfected: 114.33333333333333
    	},
    	{
    		state: "KS",
    		county: "Bourbon County",
    		avgInfected: 36.5
    	},
    	{
    		state: "KS",
    		county: "Brown County",
    		avgInfected: 46.166666666666664
    	},
    	{
    		state: "KS",
    		county: "Butler County",
    		avgInfected: 221.16666666666666
    	},
    	{
    		state: "KS",
    		county: "Chase County",
    		avgInfected: 11.5
    	},
    	{
    		state: "KS",
    		county: "Chautauqua County",
    		avgInfected: 4.5
    	},
    	{
    		state: "KS",
    		county: "Cherokee County",
    		avgInfected: 83.25
    	},
    	{
    		state: "KS",
    		county: "Cheyenne County",
    		avgInfected: 15.75
    	},
    	{
    		state: "KS",
    		county: "Clark County",
    		avgInfected: 7.916666666666667
    	},
    	{
    		state: "KS",
    		county: "Clay County",
    		avgInfected: 28.25
    	},
    	{
    		state: "KS",
    		county: "Cloud County",
    		avgInfected: 39.083333333333336
    	},
    	{
    		state: "KS",
    		county: "Coffey County",
    		avgInfected: 21.5
    	},
    	{
    		state: "KS",
    		county: "Comanche County",
    		avgInfected: 2.9166666666666665
    	},
    	{
    		state: "KS",
    		county: "Cowley County",
    		avgInfected: 99.83333333333333
    	},
    	{
    		state: "KS",
    		county: "Crawford County",
    		avgInfected: 168.83333333333334
    	},
    	{
    		state: "KS",
    		county: "Decatur County",
    		avgInfected: 15.75
    	},
    	{
    		state: "KS",
    		county: "Dickinson County",
    		avgInfected: 52.833333333333336
    	},
    	{
    		state: "KS",
    		county: "Doniphan County",
    		avgInfected: 30.25
    	},
    	{
    		state: "KS",
    		county: "Douglas County",
    		avgInfected: 342
    	},
    	{
    		state: "KS",
    		county: "Edwards County",
    		avgInfected: 10.75
    	},
    	{
    		state: "KS",
    		county: "Elk County",
    		avgInfected: 3
    	},
    	{
    		state: "KS",
    		county: "Ellis County",
    		avgInfected: 165.08333333333334
    	},
    	{
    		state: "KS",
    		county: "Ellsworth County",
    		avgInfected: 43.583333333333336
    	},
    	{
    		state: "KS",
    		county: "Finney County",
    		avgInfected: 358.9166666666667
    	},
    	{
    		state: "KS",
    		county: "Ford County",
    		avgInfected: 361.3333333333333
    	},
    	{
    		state: "KS",
    		county: "Franklin County",
    		avgInfected: 76.58333333333333
    	},
    	{
    		state: "KS",
    		county: "Geary County",
    		avgInfected: 62.333333333333336
    	},
    	{
    		state: "KS",
    		county: "Gove County",
    		avgInfected: 21.666666666666668
    	},
    	{
    		state: "KS",
    		county: "Graham County",
    		avgInfected: 9.75
    	},
    	{
    		state: "KS",
    		county: "Grant County",
    		avgInfected: 53.583333333333336
    	},
    	{
    		state: "KS",
    		county: "Gray County",
    		avgInfected: 31.916666666666668
    	},
    	{
    		state: "KS",
    		county: "Greeley County",
    		avgInfected: 6.583333333333333
    	},
    	{
    		state: "KS",
    		county: "Greenwood County",
    		avgInfected: 13.416666666666666
    	},
    	{
    		state: "KS",
    		county: "Hamilton County",
    		avgInfected: 9.583333333333334
    	},
    	{
    		state: "KS",
    		county: "Harper County",
    		avgInfected: 21.833333333333332
    	},
    	{
    		state: "KS",
    		county: "Harvey County",
    		avgInfected: 123.5
    	},
    	{
    		state: "KS",
    		county: "Haskell County",
    		avgInfected: 19.083333333333332
    	},
    	{
    		state: "KS",
    		county: "Hodgeman County",
    		avgInfected: 10.083333333333334
    	},
    	{
    		state: "KS",
    		county: "Jackson County",
    		avgInfected: 44.916666666666664
    	},
    	{
    		state: "KS",
    		county: "Jefferson County",
    		avgInfected: 48.833333333333336
    	},
    	{
    		state: "KS",
    		county: "Jewell County",
    		avgInfected: 3.5
    	},
    	{
    		state: "KS",
    		county: "Johnson County",
    		avgInfected: 1902.1666666666667
    	},
    	{
    		state: "KS",
    		county: "Kearny County",
    		avgInfected: 23.333333333333332
    	},
    	{
    		state: "KS",
    		county: "Kingman County",
    		avgInfected: 22.333333333333332
    	},
    	{
    		state: "KS",
    		county: "Kiowa County",
    		avgInfected: 7.666666666666667
    	},
    	{
    		state: "KS",
    		county: "Labette County",
    		avgInfected: 60.083333333333336
    	},
    	{
    		state: "KS",
    		county: "Lane County",
    		avgInfected: 4.583333333333333
    	},
    	{
    		state: "KS",
    		county: "Leavenworth County",
    		avgInfected: 274.75
    	},
    	{
    		state: "KS",
    		county: "Lincoln County",
    		avgInfected: 3.9166666666666665
    	},
    	{
    		state: "KS",
    		county: "Linn County",
    		avgInfected: 19.75
    	},
    	{
    		state: "KS",
    		county: "Logan County",
    		avgInfected: 16.583333333333332
    	},
    	{
    		state: "KS",
    		county: "Lyon County",
    		avgInfected: 176.5
    	},
    	{
    		state: "KS",
    		county: "McPherson County",
    		avgInfected: 95.83333333333333
    	},
    	{
    		state: "KS",
    		county: "Marion County",
    		avgInfected: 32.75
    	},
    	{
    		state: "KS",
    		county: "Marshall County",
    		avgInfected: 27.333333333333332
    	},
    	{
    		state: "KS",
    		county: "Meade County",
    		avgInfected: 21.833333333333332
    	},
    	{
    		state: "KS",
    		county: "Miami County",
    		avgInfected: 68.58333333333333
    	},
    	{
    		state: "KS",
    		county: "Mitchell County",
    		avgInfected: 13.083333333333334
    	},
    	{
    		state: "KS",
    		county: "Montgomery County",
    		avgInfected: 78.33333333333333
    	},
    	{
    		state: "KS",
    		county: "Morris County",
    		avgInfected: 12.25
    	},
    	{
    		state: "KS",
    		county: "Morton County",
    		avgInfected: 8.75
    	},
    	{
    		state: "KS",
    		county: "Nemaha County",
    		avgInfected: 68.83333333333333
    	},
    	{
    		state: "KS",
    		county: "Neosho County",
    		avgInfected: 48.916666666666664
    	},
    	{
    		state: "KS",
    		county: "Ness County",
    		avgInfected: 18.083333333333332
    	},
    	{
    		state: "KS",
    		county: "Norton County",
    		avgInfected: 85.41666666666667
    	},
    	{
    		state: "KS",
    		county: "Osage County",
    		avgInfected: 32.5
    	},
    	{
    		state: "KS",
    		county: "Osborne County",
    		avgInfected: 4.666666666666667
    	},
    	{
    		state: "KS",
    		county: "Ottawa County",
    		avgInfected: 15.333333333333334
    	},
    	{
    		state: "KS",
    		county: "Pawnee County",
    		avgInfected: 45.75
    	},
    	{
    		state: "KS",
    		county: "Phillips County",
    		avgInfected: 28.166666666666668
    	},
    	{
    		state: "KS",
    		county: "Pottawatomie County",
    		avgInfected: 49.166666666666664
    	},
    	{
    		state: "KS",
    		county: "Pratt County",
    		avgInfected: 34.666666666666664
    	},
    	{
    		state: "KS",
    		county: "Rawlins County",
    		avgInfected: 13.25
    	},
    	{
    		state: "KS",
    		county: "Reno County",
    		avgInfected: 330.75
    	},
    	{
    		state: "KS",
    		county: "Republic County",
    		avgInfected: 17.666666666666668
    	},
    	{
    		state: "KS",
    		county: "Rice County",
    		avgInfected: 26.166666666666668
    	},
    	{
    		state: "KS",
    		county: "Riley County",
    		avgInfected: 253.58333333333334
    	},
    	{
    		state: "KS",
    		county: "Rooks County",
    		avgInfected: 23.666666666666668
    	},
    	{
    		state: "KS",
    		county: "Rush County",
    		avgInfected: 13.833333333333334
    	},
    	{
    		state: "KS",
    		county: "Russell County",
    		avgInfected: 35.666666666666664
    	},
    	{
    		state: "KS",
    		county: "Saline County",
    		avgInfected: 154.16666666666666
    	},
    	{
    		state: "KS",
    		county: "Scott County",
    		avgInfected: 26.5
    	},
    	{
    		state: "KS",
    		county: "Sedgwick County",
    		avgInfected: 1865.8333333333333
    	},
    	{
    		state: "KS",
    		county: "Seward County",
    		avgInfected: 219
    	},
    	{
    		state: "KS",
    		county: "Shawnee County",
    		avgInfected: 508.0833333333333
    	},
    	{
    		state: "KS",
    		county: "Sheridan County",
    		avgInfected: 23.583333333333332
    	},
    	{
    		state: "KS",
    		county: "Sherman County",
    		avgInfected: 30.916666666666668
    	},
    	{
    		state: "KS",
    		county: "Smith County",
    		avgInfected: 7.916666666666667
    	},
    	{
    		state: "KS",
    		county: "Stafford County",
    		avgInfected: 14.083333333333334
    	},
    	{
    		state: "KS",
    		county: "Stanton County",
    		avgInfected: 10.416666666666666
    	},
    	{
    		state: "KS",
    		county: "Stevens County",
    		avgInfected: 29.166666666666668
    	},
    	{
    		state: "KS",
    		county: "Sumner County",
    		avgInfected: 52.25
    	},
    	{
    		state: "KS",
    		county: "Thomas County",
    		avgInfected: 49.75
    	},
    	{
    		state: "KS",
    		county: "Trego County",
    		avgInfected: 14.583333333333334
    	},
    	{
    		state: "KS",
    		county: "Wabaunsee County",
    		avgInfected: 22.166666666666668
    	},
    	{
    		state: "KS",
    		county: "Wallace County",
    		avgInfected: 10.666666666666666
    	},
    	{
    		state: "KS",
    		county: "Washington County",
    		avgInfected: 19.916666666666668
    	},
    	{
    		state: "KS",
    		county: "Wichita County",
    		avgInfected: 8.666666666666666
    	},
    	{
    		state: "KS",
    		county: "Wilson County",
    		avgInfected: 18.833333333333332
    	},
    	{
    		state: "KS",
    		county: "Woodson County",
    		avgInfected: 4.416666666666667
    	},
    	{
    		state: "KS",
    		county: "Wyandotte County",
    		avgInfected: 852.9166666666666
    	},
    	{
    		state: "KY",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "KY",
    		county: "Adair County",
    		avgInfected: 54.416666666666664
    	},
    	{
    		state: "KY",
    		county: "Allen County",
    		avgInfected: 53.583333333333336
    	},
    	{
    		state: "KY",
    		county: "Anderson County",
    		avgInfected: 34.416666666666664
    	},
    	{
    		state: "KY",
    		county: "Ballard County",
    		avgInfected: 10.083333333333334
    	},
    	{
    		state: "KY",
    		county: "Barren County",
    		avgInfected: 147
    	},
    	{
    		state: "KY",
    		county: "Bath County",
    		avgInfected: 17.583333333333332
    	},
    	{
    		state: "KY",
    		county: "Bell County",
    		avgInfected: 92.91666666666667
    	},
    	{
    		state: "KY",
    		county: "Boone County",
    		avgInfected: 305
    	},
    	{
    		state: "KY",
    		county: "Bourbon County",
    		avgInfected: 39.333333333333336
    	},
    	{
    		state: "KY",
    		county: "Boyd County",
    		avgInfected: 93.5
    	},
    	{
    		state: "KY",
    		county: "Boyle County",
    		avgInfected: 61.5
    	},
    	{
    		state: "KY",
    		county: "Bracken County",
    		avgInfected: 9.5
    	},
    	{
    		state: "KY",
    		county: "Breathitt County",
    		avgInfected: 23.083333333333332
    	},
    	{
    		state: "KY",
    		county: "Breckinridge County",
    		avgInfected: 32.916666666666664
    	},
    	{
    		state: "KY",
    		county: "Bullitt County",
    		avgInfected: 200.16666666666666
    	},
    	{
    		state: "KY",
    		county: "Butler County",
    		avgInfected: 40.833333333333336
    	},
    	{
    		state: "KY",
    		county: "Caldwell County",
    		avgInfected: 37.583333333333336
    	},
    	{
    		state: "KY",
    		county: "Calloway County",
    		avgInfected: 121.75
    	},
    	{
    		state: "KY",
    		county: "Campbell County",
    		avgInfected: 193.58333333333334
    	},
    	{
    		state: "KY",
    		county: "Carlisle County",
    		avgInfected: 14
    	},
    	{
    		state: "KY",
    		county: "Carroll County",
    		avgInfected: 23.833333333333332
    	},
    	{
    		state: "KY",
    		county: "Carter County",
    		avgInfected: 47.25
    	},
    	{
    		state: "KY",
    		county: "Casey County",
    		avgInfected: 36.583333333333336
    	},
    	{
    		state: "KY",
    		county: "Christian County",
    		avgInfected: 217
    	},
    	{
    		state: "KY",
    		county: "Clark County",
    		avgInfected: 60.666666666666664
    	},
    	{
    		state: "KY",
    		county: "Clay County",
    		avgInfected: 71.83333333333333
    	},
    	{
    		state: "KY",
    		county: "Clinton County",
    		avgInfected: 28.333333333333332
    	},
    	{
    		state: "KY",
    		county: "Crittenden County",
    		avgInfected: 17.583333333333332
    	},
    	{
    		state: "KY",
    		county: "Cumberland County",
    		avgInfected: 17
    	},
    	{
    		state: "KY",
    		county: "Daviess County",
    		avgInfected: 241.75
    	},
    	{
    		state: "KY",
    		county: "Edmonson County",
    		avgInfected: 25.75
    	},
    	{
    		state: "KY",
    		county: "Elliott County",
    		avgInfected: 44
    	},
    	{
    		state: "KY",
    		county: "Estill County",
    		avgInfected: 33.083333333333336
    	},
    	{
    		state: "KY",
    		county: "Fayette County",
    		avgInfected: 1221.9166666666667
    	},
    	{
    		state: "KY",
    		county: "Fleming County",
    		avgInfected: 21.916666666666668
    	},
    	{
    		state: "KY",
    		county: "Floyd County",
    		avgInfected: 80
    	},
    	{
    		state: "KY",
    		county: "Franklin County",
    		avgInfected: 96.83333333333333
    	},
    	{
    		state: "KY",
    		county: "Fulton County",
    		avgInfected: 22.5
    	},
    	{
    		state: "KY",
    		county: "Gallatin County",
    		avgInfected: 14.416666666666666
    	},
    	{
    		state: "KY",
    		county: "Garrard County",
    		avgInfected: 39.25
    	},
    	{
    		state: "KY",
    		county: "Grant County",
    		avgInfected: 42.583333333333336
    	},
    	{
    		state: "KY",
    		county: "Graves County",
    		avgInfected: 121.5
    	},
    	{
    		state: "KY",
    		county: "Grayson County",
    		avgInfected: 66.33333333333333
    	},
    	{
    		state: "KY",
    		county: "Green County",
    		avgInfected: 35.75
    	},
    	{
    		state: "KY",
    		county: "Greenup County",
    		avgInfected: 84.08333333333333
    	},
    	{
    		state: "KY",
    		county: "Hancock County",
    		avgInfected: 21.75
    	},
    	{
    		state: "KY",
    		county: "Hardin County",
    		avgInfected: 292.5833333333333
    	},
    	{
    		state: "KY",
    		county: "Harlan County",
    		avgInfected: 64.58333333333333
    	},
    	{
    		state: "KY",
    		county: "Harrison County",
    		avgInfected: 32.083333333333336
    	},
    	{
    		state: "KY",
    		county: "Hart County",
    		avgInfected: 54.5
    	},
    	{
    		state: "KY",
    		county: "Henderson County",
    		avgInfected: 150.5
    	},
    	{
    		state: "KY",
    		county: "Henry County",
    		avgInfected: 35.333333333333336
    	},
    	{
    		state: "KY",
    		county: "Hickman County",
    		avgInfected: 11.25
    	},
    	{
    		state: "KY",
    		county: "Hopkins County",
    		avgInfected: 129.16666666666666
    	},
    	{
    		state: "KY",
    		county: "Jackson County",
    		avgInfected: 50.083333333333336
    	},
    	{
    		state: "KY",
    		county: "Jefferson County",
    		avgInfected: 2617.5833333333335
    	},
    	{
    		state: "KY",
    		county: "Jessamine County",
    		avgInfected: 121.16666666666667
    	},
    	{
    		state: "KY",
    		county: "Johnson County",
    		avgInfected: 53.25
    	},
    	{
    		state: "KY",
    		county: "Kenton County",
    		avgInfected: 368.8333333333333
    	},
    	{
    		state: "KY",
    		county: "Knott County",
    		avgInfected: 39.916666666666664
    	},
    	{
    		state: "KY",
    		county: "Knox County",
    		avgInfected: 89.33333333333333
    	},
    	{
    		state: "KY",
    		county: "Larue County",
    		avgInfected: 39.083333333333336
    	},
    	{
    		state: "KY",
    		county: "Laurel County",
    		avgInfected: 180.16666666666666
    	},
    	{
    		state: "KY",
    		county: "Lawrence County",
    		avgInfected: 26.083333333333332
    	},
    	{
    		state: "KY",
    		county: "Lee County",
    		avgInfected: 56.083333333333336
    	},
    	{
    		state: "KY",
    		county: "Leslie County",
    		avgInfected: 15.25
    	},
    	{
    		state: "KY",
    		county: "Letcher County",
    		avgInfected: 35.333333333333336
    	},
    	{
    		state: "KY",
    		county: "Lewis County",
    		avgInfected: 36.25
    	},
    	{
    		state: "KY",
    		county: "Lincoln County",
    		avgInfected: 43.416666666666664
    	},
    	{
    		state: "KY",
    		county: "Livingston County",
    		avgInfected: 19.416666666666668
    	},
    	{
    		state: "KY",
    		county: "Logan County",
    		avgInfected: 86.91666666666667
    	},
    	{
    		state: "KY",
    		county: "Lyon County",
    		avgInfected: 13.833333333333334
    	},
    	{
    		state: "KY",
    		county: "McCracken County",
    		avgInfected: 174.66666666666666
    	},
    	{
    		state: "KY",
    		county: "McCreary County",
    		avgInfected: 27.416666666666668
    	},
    	{
    		state: "KY",
    		county: "McLean County",
    		avgInfected: 27.833333333333332
    	},
    	{
    		state: "KY",
    		county: "Madison County",
    		avgInfected: 268.8333333333333
    	},
    	{
    		state: "KY",
    		county: "Magoffin County",
    		avgInfected: 28.75
    	},
    	{
    		state: "KY",
    		county: "Marion County",
    		avgInfected: 67.25
    	},
    	{
    		state: "KY",
    		county: "Marshall County",
    		avgInfected: 66.33333333333333
    	},
    	{
    		state: "KY",
    		county: "Martin County",
    		avgInfected: 29.166666666666668
    	},
    	{
    		state: "KY",
    		county: "Mason County",
    		avgInfected: 25.833333333333332
    	},
    	{
    		state: "KY",
    		county: "Meade County",
    		avgInfected: 48.916666666666664
    	},
    	{
    		state: "KY",
    		county: "Menifee County",
    		avgInfected: 9.166666666666666
    	},
    	{
    		state: "KY",
    		county: "Mercer County",
    		avgInfected: 47.166666666666664
    	},
    	{
    		state: "KY",
    		county: "Metcalfe County",
    		avgInfected: 27.833333333333332
    	},
    	{
    		state: "KY",
    		county: "Monroe County",
    		avgInfected: 52.916666666666664
    	},
    	{
    		state: "KY",
    		county: "Montgomery County",
    		avgInfected: 64.66666666666667
    	},
    	{
    		state: "KY",
    		county: "Morgan County",
    		avgInfected: 20.416666666666668
    	},
    	{
    		state: "KY",
    		county: "Muhlenberg County",
    		avgInfected: 102.08333333333333
    	},
    	{
    		state: "KY",
    		county: "Nelson County",
    		avgInfected: 149.75
    	},
    	{
    		state: "KY",
    		county: "Nicholas County",
    		avgInfected: 12.25
    	},
    	{
    		state: "KY",
    		county: "Ohio County",
    		avgInfected: 67.75
    	},
    	{
    		state: "KY",
    		county: "Oldham County",
    		avgInfected: 157
    	},
    	{
    		state: "KY",
    		county: "Owen County",
    		avgInfected: 13.916666666666666
    	},
    	{
    		state: "KY",
    		county: "Owsley County",
    		avgInfected: 13.416666666666666
    	},
    	{
    		state: "KY",
    		county: "Pendleton County",
    		avgInfected: 21.75
    	},
    	{
    		state: "KY",
    		county: "Perry County",
    		avgInfected: 68.5
    	},
    	{
    		state: "KY",
    		county: "Pike County",
    		avgInfected: 128.33333333333334
    	},
    	{
    		state: "KY",
    		county: "Powell County",
    		avgInfected: 28.833333333333332
    	},
    	{
    		state: "KY",
    		county: "Pulaski County",
    		avgInfected: 111.33333333333333
    	},
    	{
    		state: "KY",
    		county: "Robertson County",
    		avgInfected: 5.583333333333333
    	},
    	{
    		state: "KY",
    		county: "Rockcastle County",
    		avgInfected: 37.666666666666664
    	},
    	{
    		state: "KY",
    		county: "Rowan County",
    		avgInfected: 52.916666666666664
    	},
    	{
    		state: "KY",
    		county: "Russell County",
    		avgInfected: 41.166666666666664
    	},
    	{
    		state: "KY",
    		county: "Scott County",
    		avgInfected: 124.91666666666667
    	},
    	{
    		state: "KY",
    		county: "Shelby County",
    		avgInfected: 163.08333333333334
    	},
    	{
    		state: "KY",
    		county: "Simpson County",
    		avgInfected: 42.333333333333336
    	},
    	{
    		state: "KY",
    		county: "Spencer County",
    		avgInfected: 43.416666666666664
    	},
    	{
    		state: "KY",
    		county: "Taylor County",
    		avgInfected: 64.41666666666667
    	},
    	{
    		state: "KY",
    		county: "Todd County",
    		avgInfected: 30.583333333333332
    	},
    	{
    		state: "KY",
    		county: "Trigg County",
    		avgInfected: 28.916666666666668
    	},
    	{
    		state: "KY",
    		county: "Trimble County",
    		avgInfected: 11.333333333333334
    	},
    	{
    		state: "KY",
    		county: "Union County",
    		avgInfected: 54.583333333333336
    	},
    	{
    		state: "KY",
    		county: "Warren County",
    		avgInfected: 541.8333333333334
    	},
    	{
    		state: "KY",
    		county: "Washington County",
    		avgInfected: 34.666666666666664
    	},
    	{
    		state: "KY",
    		county: "Wayne County",
    		avgInfected: 36.083333333333336
    	},
    	{
    		state: "KY",
    		county: "Webster County",
    		avgInfected: 42.083333333333336
    	},
    	{
    		state: "KY",
    		county: "Whitley County",
    		avgInfected: 106.58333333333333
    	},
    	{
    		state: "KY",
    		county: "Wolfe County",
    		avgInfected: 12.25
    	},
    	{
    		state: "KY",
    		county: "Woodford County",
    		avgInfected: 51.083333333333336
    	},
    	{
    		state: "LA",
    		county: "Statewide Unallocated",
    		avgInfected: 28.75
    	},
    	{
    		state: "LA",
    		county: "Acadia Parish",
    		avgInfected: 302.8333333333333
    	},
    	{
    		state: "LA",
    		county: "Allen Parish",
    		avgInfected: 165.83333333333334
    	},
    	{
    		state: "LA",
    		county: "Ascension Parish",
    		avgInfected: 435.6666666666667
    	},
    	{
    		state: "LA",
    		county: "Assumption Parish",
    		avgInfected: 79.25
    	},
    	{
    		state: "LA",
    		county: "Avoyelles Parish",
    		avgInfected: 163.41666666666666
    	},
    	{
    		state: "LA",
    		county: "Beauregard Parish",
    		avgInfected: 104.5
    	},
    	{
    		state: "LA",
    		county: "Bienville Parish",
    		avgInfected: 59.166666666666664
    	},
    	{
    		state: "LA",
    		county: "Bossier Parish",
    		avgInfected: 468.75
    	},
    	{
    		state: "LA",
    		county: "Caddo Parish",
    		avgInfected: 994
    	},
    	{
    		state: "LA",
    		county: "Calcasieu Parish",
    		avgInfected: 818.8333333333334
    	},
    	{
    		state: "LA",
    		county: "Caldwell Parish",
    		avgInfected: 44.916666666666664
    	},
    	{
    		state: "LA",
    		county: "Cameron Parish",
    		avgInfected: 22.583333333333332
    	},
    	{
    		state: "LA",
    		county: "Catahoula Parish",
    		avgInfected: 45.5
    	},
    	{
    		state: "LA",
    		county: "Claiborne Parish",
    		avgInfected: 59.083333333333336
    	},
    	{
    		state: "LA",
    		county: "Concordia Parish",
    		avgInfected: 69.08333333333333
    	},
    	{
    		state: "LA",
    		county: "De Soto Parish",
    		avgInfected: 96.91666666666667
    	},
    	{
    		state: "LA",
    		county: "East Baton Rouge Parish",
    		avgInfected: 1534.6666666666667
    	},
    	{
    		state: "LA",
    		county: "East Carroll Parish",
    		avgInfected: 54.916666666666664
    	},
    	{
    		state: "LA",
    		county: "East Feliciana Parish",
    		avgInfected: 169.5
    	},
    	{
    		state: "LA",
    		county: "Evangeline Parish",
    		avgInfected: 141.16666666666666
    	},
    	{
    		state: "LA",
    		county: "Franklin Parish",
    		avgInfected: 129
    	},
    	{
    		state: "LA",
    		county: "Grant Parish",
    		avgInfected: 55
    	},
    	{
    		state: "LA",
    		county: "Iberia Parish",
    		avgInfected: 286.0833333333333
    	},
    	{
    		state: "LA",
    		county: "Iberville Parish",
    		avgInfected: 143.25
    	},
    	{
    		state: "LA",
    		county: "Jackson Parish",
    		avgInfected: 88.5
    	},
    	{
    		state: "LA",
    		county: "Jefferson Davis Parish",
    		avgInfected: 1723.3333333333333
    	},
    	{
    		state: "LA",
    		county: "Jefferson Parish",
    		avgInfected: 128.41666666666666
    	},
    	{
    		state: "LA",
    		county: "La Salle Parish",
    		avgInfected: 67.58333333333333
    	},
    	{
    		state: "LA",
    		county: "Lafayette Parish",
    		avgInfected: 913.5833333333334
    	},
    	{
    		state: "LA",
    		county: "Lafourche Parish",
    		avgInfected: 358.25
    	},
    	{
    		state: "LA",
    		county: "Lincoln Parish",
    		avgInfected: 188.16666666666666
    	},
    	{
    		state: "LA",
    		county: "Livingston Parish",
    		avgInfected: 442.75
    	},
    	{
    		state: "LA",
    		county: "Madison Parish",
    		avgInfected: 82.25
    	},
    	{
    		state: "LA",
    		county: "Morehouse Parish",
    		avgInfected: 93.83333333333333
    	},
    	{
    		state: "LA",
    		county: "Natchitoches Parish",
    		avgInfected: 152.91666666666666
    	},
    	{
    		state: "LA",
    		county: "Orleans Parish",
    		avgInfected: 1239.5
    	},
    	{
    		state: "LA",
    		county: "Ouachita Parish",
    		avgInfected: 727.25
    	},
    	{
    		state: "LA",
    		county: "Plaquemines Parish",
    		avgInfected: 87.33333333333333
    	},
    	{
    		state: "LA",
    		county: "Pointe Coupee Parish",
    		avgInfected: 106.5
    	},
    	{
    		state: "LA",
    		county: "Rapides Parish",
    		avgInfected: 485.4166666666667
    	},
    	{
    		state: "LA",
    		county: "Red River Parish",
    		avgInfected: 45.75
    	},
    	{
    		state: "LA",
    		county: "Richland Parish",
    		avgInfected: 101.16666666666667
    	},
    	{
    		state: "LA",
    		county: "Sabine Parish",
    		avgInfected: 107.41666666666667
    	},
    	{
    		state: "LA",
    		county: "St. Bernard Parish",
    		avgInfected: 142
    	},
    	{
    		state: "LA",
    		county: "St. Charles Parish",
    		avgInfected: 193.33333333333334
    	},
    	{
    		state: "LA",
    		county: "St. Helena Parish",
    		avgInfected: 40.75
    	},
    	{
    		state: "LA",
    		county: "St. James Parish",
    		avgInfected: 77.25
    	},
    	{
    		state: "LA",
    		county: "St. John the Baptist Parish",
    		avgInfected: 153.66666666666666
    	},
    	{
    		state: "LA",
    		county: "St. Landry Parish",
    		avgInfected: 373.9166666666667
    	},
    	{
    		state: "LA",
    		county: "St. Martin Parish",
    		avgInfected: 210.66666666666666
    	},
    	{
    		state: "LA",
    		county: "St. Mary Parish",
    		avgInfected: 188
    	},
    	{
    		state: "LA",
    		county: "St. Tammany Parish",
    		avgInfected: 771.25
    	},
    	{
    		state: "LA",
    		county: "Tangipahoa Parish",
    		avgInfected: 506.5833333333333
    	},
    	{
    		state: "LA",
    		county: "Tensas Parish",
    		avgInfected: 16.916666666666668
    	},
    	{
    		state: "LA",
    		county: "Terrebonne Parish",
    		avgInfected: 353.1666666666667
    	},
    	{
    		state: "LA",
    		county: "Union Parish",
    		avgInfected: 110.41666666666667
    	},
    	{
    		state: "LA",
    		county: "Vermilion Parish",
    		avgInfected: 198.33333333333334
    	},
    	{
    		state: "LA",
    		county: "Vernon Parish",
    		avgInfected: 106.75
    	},
    	{
    		state: "LA",
    		county: "Washington Parish",
    		avgInfected: 174.66666666666666
    	},
    	{
    		state: "LA",
    		county: "Webster Parish",
    		avgInfected: 147.33333333333334
    	},
    	{
    		state: "LA",
    		county: "West Baton Rouge Parish",
    		avgInfected: 100.08333333333333
    	},
    	{
    		state: "LA",
    		county: "West Carroll Parish",
    		avgInfected: 40.75
    	},
    	{
    		state: "LA",
    		county: "West Feliciana Parish",
    		avgInfected: 64.5
    	},
    	{
    		state: "LA",
    		county: "Winn Parish",
    		avgInfected: 72.58333333333333
    	},
    	{
    		state: "ME",
    		county: "Statewide Unallocated",
    		avgInfected: 0.25
    	},
    	{
    		state: "ME",
    		county: "Androscoggin County",
    		avgInfected: 109.08333333333333
    	},
    	{
    		state: "ME",
    		county: "Aroostook County",
    		avgInfected: 7.583333333333333
    	},
    	{
    		state: "ME",
    		county: "Cumberland County",
    		avgInfected: 288.1666666666667
    	},
    	{
    		state: "ME",
    		county: "Franklin County",
    		avgInfected: 15.583333333333334
    	},
    	{
    		state: "ME",
    		county: "Hancock County",
    		avgInfected: 16.75
    	},
    	{
    		state: "ME",
    		county: "Kennebec County",
    		avgInfected: 53.25
    	},
    	{
    		state: "ME",
    		county: "Knox County",
    		avgInfected: 14.916666666666666
    	},
    	{
    		state: "ME",
    		county: "Lincoln County",
    		avgInfected: 10.916666666666666
    	},
    	{
    		state: "ME",
    		county: "Oxford County",
    		avgInfected: 23.083333333333332
    	},
    	{
    		state: "ME",
    		county: "Penobscot County",
    		avgInfected: 49.833333333333336
    	},
    	{
    		state: "ME",
    		county: "Piscataquis County",
    		avgInfected: 2.6666666666666665
    	},
    	{
    		state: "ME",
    		county: "Sagadahoc County",
    		avgInfected: 10.583333333333334
    	},
    	{
    		state: "ME",
    		county: "Somerset County",
    		avgInfected: 32.25
    	},
    	{
    		state: "ME",
    		county: "Waldo County",
    		avgInfected: 16.833333333333332
    	},
    	{
    		state: "ME",
    		county: "Washington County",
    		avgInfected: 14.333333333333334
    	},
    	{
    		state: "ME",
    		county: "York County",
    		avgInfected: 163.75
    	},
    	{
    		state: "MD",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "MD",
    		county: "Allegany County",
    		avgInfected: 165.83333333333334
    	},
    	{
    		state: "MD",
    		county: "Anne Arundel County",
    		avgInfected: 1244.25
    	},
    	{
    		state: "MD",
    		county: "Baltimore County",
    		avgInfected: 2146.0833333333335
    	},
    	{
    		state: "MD",
    		county: "Calvert County",
    		avgInfected: 119.16666666666667
    	},
    	{
    		state: "MD",
    		county: "Caroline County",
    		avgInfected: 69.91666666666667
    	},
    	{
    		state: "MD",
    		county: "Carroll County",
    		avgInfected: 240
    	},
    	{
    		state: "MD",
    		county: "Cecil County",
    		avgInfected: 145.33333333333334
    	},
    	{
    		state: "MD",
    		county: "Charles County",
    		avgInfected: 323.3333333333333
    	},
    	{
    		state: "MD",
    		county: "Dorchester County",
    		avgInfected: 77.41666666666667
    	},
    	{
    		state: "MD",
    		county: "Frederick County",
    		avgInfected: 488.25
    	},
    	{
    		state: "MD",
    		county: "Garrett County",
    		avgInfected: 34
    	},
    	{
    		state: "MD",
    		county: "Harford County",
    		avgInfected: 425.1666666666667
    	},
    	{
    		state: "MD",
    		county: "Howard County",
    		avgInfected: 592.1666666666666
    	},
    	{
    		state: "MD",
    		county: "Kent County",
    		avgInfected: 32.25
    	},
    	{
    		state: "MD",
    		county: "Montgomery County",
    		avgInfected: 2524.8333333333335
    	},
    	{
    		state: "MD",
    		county: "Prince George's County",
    		avgInfected: 3131.75
    	},
    	{
    		state: "MD",
    		county: "Queen Anne's County",
    		avgInfected: 80.25
    	},
    	{
    		state: "MD",
    		county: "St. Mary's County",
    		avgInfected: 151.25
    	},
    	{
    		state: "MD",
    		county: "Somerset County",
    		avgInfected: 50.75
    	},
    	{
    		state: "MD",
    		county: "Talbot County",
    		avgInfected: 60.5
    	},
    	{
    		state: "MD",
    		county: "Washington County",
    		avgInfected: 274.5833333333333
    	},
    	{
    		state: "MD",
    		county: "Wicomico County",
    		avgInfected: 252.75
    	},
    	{
    		state: "MD",
    		county: "Worcester County",
    		avgInfected: 116
    	},
    	{
    		state: "MD",
    		county: "Baltimore City",
    		avgInfected: 1815.25
    	},
    	{
    		state: "MA",
    		county: "Statewide Unallocated",
    		avgInfected: 119.08333333333333
    	},
    	{
    		state: "MA",
    		county: "Barnstable County",
    		avgInfected: 223.41666666666666
    	},
    	{
    		state: "MA",
    		county: "Berkshire County",
    		avgInfected: 102.08333333333333
    	},
    	{
    		state: "MA",
    		county: "Bristol County",
    		avgInfected: 1476.75
    	},
    	{
    		state: "MA",
    		county: "Dukes County",
    		avgInfected: 17.916666666666668
    	},
    	{
    		state: "MA",
    		county: "Essex County",
    		avgInfected: 2590.6666666666665
    	},
    	{
    		state: "MA",
    		county: "Franklin County",
    		avgInfected: 50.416666666666664
    	},
    	{
    		state: "MA",
    		county: "Hampden County",
    		avgInfected: 1165.75
    	},
    	{
    		state: "MA",
    		county: "Hampshire County",
    		avgInfected: 178.83333333333334
    	},
    	{
    		state: "MA",
    		county: "Middlesex County",
    		avgInfected: 3540.5833333333335
    	},
    	{
    		state: "MA",
    		county: "Nantucket County",
    		avgInfected: 22.166666666666668
    	},
    	{
    		state: "MA",
    		county: "Norfolk County",
    		avgInfected: 1318.5833333333333
    	},
    	{
    		state: "MA",
    		county: "Plymouth County",
    		avgInfected: 1157.25
    	},
    	{
    		state: "MA",
    		county: "Suffolk County",
    		avgInfected: 2923.5
    	},
    	{
    		state: "MA",
    		county: "Worcester County",
    		avgInfected: 2016.0833333333333
    	},
    	{
    		state: "MI",
    		county: "Statewide Unallocated",
    		avgInfected: 914.75
    	},
    	{
    		state: "MI",
    		county: "Alcona County",
    		avgInfected: 10.083333333333334
    	},
    	{
    		state: "MI",
    		county: "Alger County",
    		avgInfected: 16.5
    	},
    	{
    		state: "MI",
    		county: "Allegan County",
    		avgInfected: 261.5
    	},
    	{
    		state: "MI",
    		county: "Alpena County",
    		avgInfected: 33.333333333333336
    	},
    	{
    		state: "MI",
    		county: "Antrim County",
    		avgInfected: 25
    	},
    	{
    		state: "MI",
    		county: "Arenac County",
    		avgInfected: 23.583333333333332
    	},
    	{
    		state: "MI",
    		county: "Baraga County",
    		avgInfected: 30.333333333333332
    	},
    	{
    		state: "MI",
    		county: "Barry County",
    		avgInfected: 132.66666666666666
    	},
    	{
    		state: "MI",
    		county: "Bay County",
    		avgInfected: 282.5
    	},
    	{
    		state: "MI",
    		county: "Benzie County",
    		avgInfected: 21.833333333333332
    	},
    	{
    		state: "MI",
    		county: "Berrien County",
    		avgInfected: 437.8333333333333
    	},
    	{
    		state: "MI",
    		county: "Branch County",
    		avgInfected: 153.08333333333334
    	},
    	{
    		state: "MI",
    		county: "Calhoun County",
    		avgInfected: 432.3333333333333
    	},
    	{
    		state: "MI",
    		county: "Cass County",
    		avgInfected: 150.41666666666666
    	},
    	{
    		state: "MI",
    		county: "Charlevoix County",
    		avgInfected: 34.833333333333336
    	},
    	{
    		state: "MI",
    		county: "Cheboygan County",
    		avgInfected: 30.666666666666668
    	},
    	{
    		state: "MI",
    		county: "Chippewa County",
    		avgInfected: 55.416666666666664
    	},
    	{
    		state: "MI",
    		county: "Clare County",
    		avgInfected: 49.333333333333336
    	},
    	{
    		state: "MI",
    		county: "Clinton County",
    		avgInfected: 190.5
    	},
    	{
    		state: "MI",
    		county: "Crawford County",
    		avgInfected: 22.083333333333332
    	},
    	{
    		state: "MI",
    		county: "Delta County",
    		avgInfected: 184.83333333333334
    	},
    	{
    		state: "MI",
    		county: "Dickinson County",
    		avgInfected: 120.5
    	},
    	{
    		state: "MI",
    		county: "Eaton County",
    		avgInfected: 202
    	},
    	{
    		state: "MI",
    		county: "Emmet County",
    		avgInfected: 67.16666666666667
    	},
    	{
    		state: "MI",
    		county: "Genesee County",
    		avgInfected: 981.0833333333334
    	},
    	{
    		state: "MI",
    		county: "Gladwin County",
    		avgInfected: 48.75
    	},
    	{
    		state: "MI",
    		county: "Gogebic County",
    		avgInfected: 57.083333333333336
    	},
    	{
    		state: "MI",
    		county: "Grand Traverse County",
    		avgInfected: 120.91666666666667
    	},
    	{
    		state: "MI",
    		county: "Gratiot County",
    		avgInfected: 103.41666666666667
    	},
    	{
    		state: "MI",
    		county: "Hillsdale County",
    		avgInfected: 103.33333333333333
    	},
    	{
    		state: "MI",
    		county: "Houghton County",
    		avgInfected: 114.41666666666667
    	},
    	{
    		state: "MI",
    		county: "Huron County",
    		avgInfected: 45.833333333333336
    	},
    	{
    		state: "MI",
    		county: "Ingham County",
    		avgInfected: 618.4166666666666
    	},
    	{
    		state: "MI",
    		county: "Ionia County",
    		avgInfected: 147.33333333333334
    	},
    	{
    		state: "MI",
    		county: "Iosco County",
    		avgInfected: 47.75
    	},
    	{
    		state: "MI",
    		county: "Iron County",
    		avgInfected: 54.416666666666664
    	},
    	{
    		state: "MI",
    		county: "Isabella County",
    		avgInfected: 166.83333333333334
    	},
    	{
    		state: "MI",
    		county: "Jackson County",
    		avgInfected: 323.3333333333333
    	},
    	{
    		state: "MI",
    		county: "Kalamazoo County",
    		avgInfected: 664.6666666666666
    	},
    	{
    		state: "MI",
    		county: "Kalkaska County",
    		avgInfected: 22.916666666666668
    	},
    	{
    		state: "MI",
    		county: "Kent County",
    		avgInfected: 2254.0833333333335
    	},
    	{
    		state: "MI",
    		county: "Keweenaw County",
    		avgInfected: 4.75
    	},
    	{
    		state: "MI",
    		county: "Lake County",
    		avgInfected: 12.916666666666666
    	},
    	{
    		state: "MI",
    		county: "Lapeer County",
    		avgInfected: 152.66666666666666
    	},
    	{
    		state: "MI",
    		county: "Leelanau County",
    		avgInfected: 25
    	},
    	{
    		state: "MI",
    		county: "Lenawee County",
    		avgInfected: 160.58333333333334
    	},
    	{
    		state: "MI",
    		county: "Livingston County",
    		avgInfected: 341.5833333333333
    	},
    	{
    		state: "MI",
    		county: "Luce County",
    		avgInfected: 12.666666666666666
    	},
    	{
    		state: "MI",
    		county: "Mackinac County",
    		avgInfected: 19.75
    	},
    	{
    		state: "MI",
    		county: "Macomb County",
    		avgInfected: 2517.5833333333335
    	},
    	{
    		state: "MI",
    		county: "Manistee County",
    		avgInfected: 23.666666666666668
    	},
    	{
    		state: "MI",
    		county: "Marquette County",
    		avgInfected: 199.41666666666666
    	},
    	{
    		state: "MI",
    		county: "Mason County",
    		avgInfected: 40.583333333333336
    	},
    	{
    		state: "MI",
    		county: "Mecosta County",
    		avgInfected: 83.41666666666667
    	},
    	{
    		state: "MI",
    		county: "Menominee County",
    		avgInfected: 94.91666666666667
    	},
    	{
    		state: "MI",
    		county: "Midland County",
    		avgInfected: 202.91666666666666
    	},
    	{
    		state: "MI",
    		county: "Missaukee County",
    		avgInfected: 18.416666666666668
    	},
    	{
    		state: "MI",
    		county: "Monroe County",
    		avgInfected: 338
    	},
    	{
    		state: "MI",
    		county: "Montcalm County",
    		avgInfected: 121.08333333333333
    	},
    	{
    		state: "MI",
    		county: "Montmorency County",
    		avgInfected: 8.583333333333334
    	},
    	{
    		state: "MI",
    		county: "Muskegon County",
    		avgInfected: 483.5
    	},
    	{
    		state: "MI",
    		county: "Newaygo County",
    		avgInfected: 105.41666666666667
    	},
    	{
    		state: "MI",
    		county: "Oakland County",
    		avgInfected: 3193.75
    	},
    	{
    		state: "MI",
    		county: "Oceana County",
    		avgInfected: 83.58333333333333
    	},
    	{
    		state: "MI",
    		county: "Ogemaw County",
    		avgInfected: 29.25
    	},
    	{
    		state: "MI",
    		county: "Ontonagon County",
    		avgInfected: 20.916666666666668
    	},
    	{
    		state: "MI",
    		county: "Osceola County",
    		avgInfected: 32.833333333333336
    	},
    	{
    		state: "MI",
    		county: "Oscoda County",
    		avgInfected: 9.25
    	},
    	{
    		state: "MI",
    		county: "Otsego County",
    		avgInfected: 50.25
    	},
    	{
    		state: "MI",
    		county: "Ottawa County",
    		avgInfected: 920
    	},
    	{
    		state: "MI",
    		county: "Presque Isle County",
    		avgInfected: 15.083333333333334
    	},
    	{
    		state: "MI",
    		county: "Roscommon County",
    		avgInfected: 36.666666666666664
    	},
    	{
    		state: "MI",
    		county: "Saginaw County",
    		avgInfected: 582.3333333333334
    	},
    	{
    		state: "MI",
    		county: "St. Clair County",
    		avgInfected: 280.3333333333333
    	},
    	{
    		state: "MI",
    		county: "St. Joseph County",
    		avgInfected: 182
    	},
    	{
    		state: "MI",
    		county: "Sanilac County",
    		avgInfected: 40.583333333333336
    	},
    	{
    		state: "MI",
    		county: "Schoolcraft County",
    		avgInfected: 13.333333333333334
    	},
    	{
    		state: "MI",
    		county: "Shiawassee County",
    		avgInfected: 126
    	},
    	{
    		state: "MI",
    		county: "Tuscola County",
    		avgInfected: 111.91666666666667
    	},
    	{
    		state: "MI",
    		county: "Van Buren County",
    		avgInfected: 184.08333333333334
    	},
    	{
    		state: "MI",
    		county: "Washtenaw County",
    		avgInfected: 685.6666666666666
    	},
    	{
    		state: "MI",
    		county: "Wayne County",
    		avgInfected: 4560.083333333333
    	},
    	{
    		state: "MI",
    		county: "Wexford County",
    		avgInfected: 37.083333333333336
    	},
    	{
    		state: "MN",
    		county: "Aitkin County",
    		avgInfected: 46.916666666666664
    	},
    	{
    		state: "MN",
    		county: "Anoka County",
    		avgInfected: 1488.25
    	},
    	{
    		state: "MN",
    		county: "Becker County",
    		avgInfected: 124.33333333333333
    	},
    	{
    		state: "MN",
    		county: "Beltrami County",
    		avgInfected: 138.25
    	},
    	{
    		state: "MN",
    		county: "Benton County",
    		avgInfected: 197.5
    	},
    	{
    		state: "MN",
    		county: "Big Stone County",
    		avgInfected: 21.333333333333332
    	},
    	{
    		state: "MN",
    		county: "Blue Earth County",
    		avgInfected: 286.3333333333333
    	},
    	{
    		state: "MN",
    		county: "Brown County",
    		avgInfected: 80
    	},
    	{
    		state: "MN",
    		county: "Carlton County",
    		avgInfected: 109.41666666666667
    	},
    	{
    		state: "MN",
    		county: "Carver County",
    		avgInfected: 299.5
    	},
    	{
    		state: "MN",
    		county: "Cass County",
    		avgInfected: 88.08333333333333
    	},
    	{
    		state: "MN",
    		county: "Chippewa County",
    		avgInfected: 58.083333333333336
    	},
    	{
    		state: "MN",
    		county: "Chisago County",
    		avgInfected: 212.25
    	},
    	{
    		state: "MN",
    		county: "Clay County",
    		avgInfected: 339.6666666666667
    	},
    	{
    		state: "MN",
    		county: "Clearwater County",
    		avgInfected: 32.25
    	},
    	{
    		state: "MN",
    		county: "Cook County",
    		avgInfected: 4.166666666666667
    	},
    	{
    		state: "MN",
    		county: "Cottonwood County",
    		avgInfected: 48.333333333333336
    	},
    	{
    		state: "MN",
    		county: "Crow Wing County",
    		avgInfected: 234.16666666666666
    	},
    	{
    		state: "MN",
    		county: "Dakota County",
    		avgInfected: 1445
    	},
    	{
    		state: "MN",
    		county: "Dodge County",
    		avgInfected: 60.25
    	},
    	{
    		state: "MN",
    		county: "Douglas County",
    		avgInfected: 156.66666666666666
    	},
    	{
    		state: "MN",
    		county: "Faribault County",
    		avgInfected: 35.833333333333336
    	},
    	{
    		state: "MN",
    		county: "Fillmore County",
    		avgInfected: 44.666666666666664
    	},
    	{
    		state: "MN",
    		county: "Freeborn County",
    		avgInfected: 102.91666666666667
    	},
    	{
    		state: "MN",
    		county: "Goodhue County",
    		avgInfected: 128.75
    	},
    	{
    		state: "MN",
    		county: "Grant County",
    		avgInfected: 16.416666666666668
    	},
    	{
    		state: "MN",
    		county: "Hennepin County",
    		avgInfected: 4555.166666666667
    	},
    	{
    		state: "MN",
    		county: "Houston County",
    		avgInfected: 45.25
    	},
    	{
    		state: "MN",
    		county: "Hubbard County",
    		avgInfected: 70.25
    	},
    	{
    		state: "MN",
    		county: "Isanti County",
    		avgInfected: 120.25
    	},
    	{
    		state: "MN",
    		county: "Itasca County",
    		avgInfected: 127.75
    	},
    	{
    		state: "MN",
    		county: "Jackson County",
    		avgInfected: 29.833333333333332
    	},
    	{
    		state: "MN",
    		county: "Kanabec County",
    		avgInfected: 37.916666666666664
    	},
    	{
    		state: "MN",
    		county: "Kandiyohi County",
    		avgInfected: 253.91666666666666
    	},
    	{
    		state: "MN",
    		county: "Kittson County",
    		avgInfected: 12.5
    	},
    	{
    		state: "MN",
    		county: "Koochiching County",
    		avgInfected: 25
    	},
    	{
    		state: "MN",
    		county: "Lac Qui Parle County",
    		avgInfected: 23.25
    	},
    	{
    		state: "MN",
    		county: "Lake County",
    		avgInfected: 23.75
    	},
    	{
    		state: "MN",
    		county: "Lake of the Woods County",
    		avgInfected: 6.5
    	},
    	{
    		state: "MN",
    		county: "Le Sueur County",
    		avgInfected: 97.66666666666667
    	},
    	{
    		state: "MN",
    		county: "Lincoln County",
    		avgInfected: 23.416666666666668
    	},
    	{
    		state: "MN",
    		county: "Lyon County",
    		avgInfected: 141.83333333333334
    	},
    	{
    		state: "MN",
    		county: "Mahnomen County",
    		avgInfected: 18
    	},
    	{
    		state: "MN",
    		county: "Marshall County",
    		avgInfected: 30
    	},
    	{
    		state: "MN",
    		county: "Martin County",
    		avgInfected: 74.16666666666667
    	},
    	{
    		state: "MN",
    		county: "McLeod County",
    		avgInfected: 128.25
    	},
    	{
    		state: "MN",
    		county: "Meeker County",
    		avgInfected: 73.33333333333333
    	},
    	{
    		state: "MN",
    		county: "Mille Lacs County",
    		avgInfected: 98.16666666666667
    	},
    	{
    		state: "MN",
    		county: "Morrison County",
    		avgInfected: 155.16666666666666
    	},
    	{
    		state: "MN",
    		county: "Mower County",
    		avgInfected: 179.58333333333334
    	},
    	{
    		state: "MN",
    		county: "Murray County",
    		avgInfected: 40.083333333333336
    	},
    	{
    		state: "MN",
    		county: "Nicollet County",
    		avgInfected: 110.66666666666667
    	},
    	{
    		state: "MN",
    		county: "Nobles County",
    		avgInfected: 237.91666666666666
    	},
    	{
    		state: "MN",
    		county: "Norman County",
    		avgInfected: 23.083333333333332
    	},
    	{
    		state: "MN",
    		county: "Olmsted County",
    		avgInfected: 474.8333333333333
    	},
    	{
    		state: "MN",
    		county: "Otter Tail County",
    		avgInfected: 188.41666666666666
    	},
    	{
    		state: "MN",
    		county: "Pennington County",
    		avgInfected: 37.583333333333336
    	},
    	{
    		state: "MN",
    		county: "Pine County",
    		avgInfected: 85.25
    	},
    	{
    		state: "MN",
    		county: "Pipestone County",
    		avgInfected: 50.416666666666664
    	},
    	{
    		state: "MN",
    		county: "Polk County",
    		avgInfected: 162.41666666666666
    	},
    	{
    		state: "MN",
    		county: "Pope County",
    		avgInfected: 34.916666666666664
    	},
    	{
    		state: "MN",
    		county: "Ramsey County",
    		avgInfected: 1922.5833333333333
    	},
    	{
    		state: "MN",
    		county: "Red Lake County",
    		avgInfected: 13.5
    	},
    	{
    		state: "MN",
    		county: "Redwood County",
    		avgInfected: 53.416666666666664
    	},
    	{
    		state: "MN",
    		county: "Renville County",
    		avgInfected: 48.333333333333336
    	},
    	{
    		state: "MN",
    		county: "Rice County",
    		avgInfected: 270.6666666666667
    	},
    	{
    		state: "MN",
    		county: "Rock County",
    		avgInfected: 46.916666666666664
    	},
    	{
    		state: "MN",
    		county: "Roseau County",
    		avgInfected: 68.83333333333333
    	},
    	{
    		state: "MN",
    		county: "Scott County",
    		avgInfected: 558.4166666666666
    	},
    	{
    		state: "MN",
    		county: "Sherburne County",
    		avgInfected: 379.8333333333333
    	},
    	{
    		state: "MN",
    		county: "Sibley County",
    		avgInfected: 49.416666666666664
    	},
    	{
    		state: "MN",
    		county: "St. Louis County",
    		avgInfected: 545.5
    	},
    	{
    		state: "MN",
    		county: "Statewide Unallocated",
    		avgInfected: 31.083333333333332
    	},
    	{
    		state: "MN",
    		county: "Stearns County",
    		avgInfected: 936.5
    	},
    	{
    		state: "MN",
    		county: "Steele County",
    		avgInfected: 123.5
    	},
    	{
    		state: "MN",
    		county: "Stevens County",
    		avgInfected: 31.666666666666668
    	},
    	{
    		state: "MN",
    		county: "Swift County",
    		avgInfected: 36.833333333333336
    	},
    	{
    		state: "MN",
    		county: "Todd County",
    		avgInfected: 127.91666666666667
    	},
    	{
    		state: "MN",
    		county: "Traverse County",
    		avgInfected: 9.083333333333334
    	},
    	{
    		state: "MN",
    		county: "Wabasha County",
    		avgInfected: 66.75
    	},
    	{
    		state: "MN",
    		county: "Wadena County",
    		avgInfected: 51.083333333333336
    	},
    	{
    		state: "MN",
    		county: "Waseca County",
    		avgInfected: 100.08333333333333
    	},
    	{
    		state: "MN",
    		county: "Washington County",
    		avgInfected: 957.9166666666666
    	},
    	{
    		state: "MN",
    		county: "Watonwan County",
    		avgInfected: 60.833333333333336
    	},
    	{
    		state: "MN",
    		county: "Wilkin County",
    		avgInfected: 24.333333333333332
    	},
    	{
    		state: "MN",
    		county: "Winona County",
    		avgInfected: 188.33333333333334
    	},
    	{
    		state: "MN",
    		county: "Wright County",
    		avgInfected: 484.75
    	},
    	{
    		state: "MN",
    		county: "Yellow Medicine County",
    		avgInfected: 41.583333333333336
    	},
    	{
    		state: "MS",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "MS",
    		county: "Adams County",
    		avgInfected: 108
    	},
    	{
    		state: "MS",
    		county: "Alcorn County",
    		avgInfected: 116.5
    	},
    	{
    		state: "MS",
    		county: "Amite County",
    		avgInfected: 39.666666666666664
    	},
    	{
    		state: "MS",
    		county: "Attala County",
    		avgInfected: 84.91666666666667
    	},
    	{
    		state: "MS",
    		county: "Benton County",
    		avgInfected: 39.666666666666664
    	},
    	{
    		state: "MS",
    		county: "Bolivar County",
    		avgInfected: 192.91666666666666
    	},
    	{
    		state: "MS",
    		county: "Calhoun County",
    		avgInfected: 58
    	},
    	{
    		state: "MS",
    		county: "Carroll County",
    		avgInfected: 55.916666666666664
    	},
    	{
    		state: "MS",
    		county: "Chickasaw County",
    		avgInfected: 82.75
    	},
    	{
    		state: "MS",
    		county: "Choctaw County",
    		avgInfected: 24.083333333333332
    	},
    	{
    		state: "MS",
    		county: "Claiborne County",
    		avgInfected: 47.5
    	},
    	{
    		state: "MS",
    		county: "Clarke County",
    		avgInfected: 71.58333333333333
    	},
    	{
    		state: "MS",
    		county: "Clay County",
    		avgInfected: 68.91666666666667
    	},
    	{
    		state: "MS",
    		county: "Coahoma County",
    		avgInfected: 119.08333333333333
    	},
    	{
    		state: "MS",
    		county: "Copiah County",
    		avgInfected: 129.25
    	},
    	{
    		state: "MS",
    		county: "Covington County",
    		avgInfected: 93.5
    	},
    	{
    		state: "MS",
    		county: "DeSoto County",
    		avgInfected: 769.3333333333334
    	},
    	{
    		state: "MS",
    		county: "Forrest County",
    		avgInfected: 293.0833333333333
    	},
    	{
    		state: "MS",
    		county: "Franklin County",
    		avgInfected: 24.916666666666668
    	},
    	{
    		state: "MS",
    		county: "George County",
    		avgInfected: 98.5
    	},
    	{
    		state: "MS",
    		county: "Greene County",
    		avgInfected: 47.25
    	},
    	{
    		state: "MS",
    		county: "Grenada County",
    		avgInfected: 110.58333333333333
    	},
    	{
    		state: "MS",
    		county: "Hancock County",
    		avgInfected: 91.5
    	},
    	{
    		state: "MS",
    		county: "Harrison County",
    		avgInfected: 550.3333333333334
    	},
    	{
    		state: "MS",
    		county: "Hinds County",
    		avgInfected: 771.75
    	},
    	{
    		state: "MS",
    		county: "Holmes County",
    		avgInfected: 101.16666666666667
    	},
    	{
    		state: "MS",
    		county: "Humphreys County",
    		avgInfected: 42.416666666666664
    	},
    	{
    		state: "MS",
    		county: "Issaquena County",
    		avgInfected: 9
    	},
    	{
    		state: "MS",
    		county: "Itawamba County",
    		avgInfected: 117.5
    	},
    	{
    		state: "MS",
    		county: "Jackson County",
    		avgInfected: 491
    	},
    	{
    		state: "MS",
    		county: "Jasper County",
    		avgInfected: 65.41666666666667
    	},
    	{
    		state: "MS",
    		county: "Jefferson County",
    		avgInfected: 27.333333333333332
    	},
    	{
    		state: "MS",
    		county: "Jefferson Davis County",
    		avgInfected: 43.583333333333336
    	},
    	{
    		state: "MS",
    		county: "Jones County",
    		avgInfected: 278.0833333333333
    	},
    	{
    		state: "MS",
    		county: "Kemper County",
    		avgInfected: 32.666666666666664
    	},
    	{
    		state: "MS",
    		county: "Lafayette County",
    		avgInfected: 247.33333333333334
    	},
    	{
    		state: "MS",
    		county: "Lamar County",
    		avgInfected: 221.33333333333334
    	},
    	{
    		state: "MS",
    		county: "Lauderdale County",
    		avgInfected: 263.6666666666667
    	},
    	{
    		state: "MS",
    		county: "Lawrence County",
    		avgInfected: 56.166666666666664
    	},
    	{
    		state: "MS",
    		county: "Leake County",
    		avgInfected: 107.16666666666667
    	},
    	{
    		state: "MS",
    		county: "Lee County",
    		avgInfected: 385.1666666666667
    	},
    	{
    		state: "MS",
    		county: "Leflore County",
    		avgInfected: 163.75
    	},
    	{
    		state: "MS",
    		county: "Lincoln County",
    		avgInfected: 145.5
    	},
    	{
    		state: "MS",
    		county: "Lowndes County",
    		avgInfected: 181.58333333333334
    	},
    	{
    		state: "MS",
    		county: "Madison County",
    		avgInfected: 371.8333333333333
    	},
    	{
    		state: "MS",
    		county: "Marion County",
    		avgInfected: 88.83333333333333
    	},
    	{
    		state: "MS",
    		county: "Marshall County",
    		avgInfected: 167
    	},
    	{
    		state: "MS",
    		county: "Monroe County",
    		avgInfected: 152.25
    	},
    	{
    		state: "MS",
    		county: "Montgomery County",
    		avgInfected: 58
    	},
    	{
    		state: "MS",
    		county: "Neshoba County",
    		avgInfected: 176.08333333333334
    	},
    	{
    		state: "MS",
    		county: "Newton County",
    		avgInfected: 83.83333333333333
    	},
    	{
    		state: "MS",
    		county: "Noxubee County",
    		avgInfected: 55.916666666666664
    	},
    	{
    		state: "MS",
    		county: "Oktibbeha County",
    		avgInfected: 193.08333333333334
    	},
    	{
    		state: "MS",
    		county: "Panola County",
    		avgInfected: 168.33333333333334
    	},
    	{
    		state: "MS",
    		county: "Pearl River County",
    		avgInfected: 113.58333333333333
    	},
    	{
    		state: "MS",
    		county: "Perry County",
    		avgInfected: 51.833333333333336
    	},
    	{
    		state: "MS",
    		county: "Pike County",
    		avgInfected: 130.33333333333334
    	},
    	{
    		state: "MS",
    		county: "Pontotoc County",
    		avgInfected: 154.83333333333334
    	},
    	{
    		state: "MS",
    		county: "Prentiss County",
    		avgInfected: 112.41666666666667
    	},
    	{
    		state: "MS",
    		county: "Quitman County",
    		avgInfected: 38.5
    	},
    	{
    		state: "MS",
    		county: "Rankin County",
    		avgInfected: 419.8333333333333
    	},
    	{
    		state: "MS",
    		county: "Scott County",
    		avgInfected: 119.83333333333333
    	},
    	{
    		state: "MS",
    		county: "Sharkey County",
    		avgInfected: 24.666666666666668
    	},
    	{
    		state: "MS",
    		county: "Simpson County",
    		avgInfected: 115.25
    	},
    	{
    		state: "MS",
    		county: "Smith County",
    		avgInfected: 55.833333333333336
    	},
    	{
    		state: "MS",
    		county: "Stone County",
    		avgInfected: 55.25
    	},
    	{
    		state: "MS",
    		county: "Sunflower County",
    		avgInfected: 153
    	},
    	{
    		state: "MS",
    		county: "Tallahatchie County",
    		avgInfected: 77.75
    	},
    	{
    		state: "MS",
    		county: "Tate County",
    		avgInfected: 129.41666666666666
    	},
    	{
    		state: "MS",
    		county: "Tippah County",
    		avgInfected: 96.41666666666667
    	},
    	{
    		state: "MS",
    		county: "Tishomingo County",
    		avgInfected: 85
    	},
    	{
    		state: "MS",
    		county: "Tunica County",
    		avgInfected: 49
    	},
    	{
    		state: "MS",
    		county: "Union County",
    		avgInfected: 127.08333333333333
    	},
    	{
    		state: "MS",
    		county: "Walthall County",
    		avgInfected: 60.666666666666664
    	},
    	{
    		state: "MS",
    		county: "Warren County",
    		avgInfected: 140.08333333333334
    	},
    	{
    		state: "MS",
    		county: "Washington County",
    		avgInfected: 248.41666666666666
    	},
    	{
    		state: "MS",
    		county: "Wayne County",
    		avgInfected: 94.58333333333333
    	},
    	{
    		state: "MS",
    		county: "Webster County",
    		avgInfected: 34
    	},
    	{
    		state: "MS",
    		county: "Wilkinson County",
    		avgInfected: 30.416666666666668
    	},
    	{
    		state: "MS",
    		county: "Winston County",
    		avgInfected: 89.66666666666667
    	},
    	{
    		state: "MS",
    		county: "Yalobusha County",
    		avgInfected: 54.333333333333336
    	},
    	{
    		state: "MS",
    		county: "Yazoo County",
    		avgInfected: 119.41666666666667
    	},
    	{
    		state: "MO",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "MO",
    		county: "Adair County",
    		avgInfected: 81.33333333333333
    	},
    	{
    		state: "MO",
    		county: "Andrew County",
    		avgInfected: 56.75
    	},
    	{
    		state: "MO",
    		county: "Atchison County",
    		avgInfected: 15
    	},
    	{
    		state: "MO",
    		county: "Audrain County",
    		avgInfected: 76.75
    	},
    	{
    		state: "MO",
    		county: "Barry County",
    		avgInfected: 111.08333333333333
    	},
    	{
    		state: "MO",
    		county: "Barton County",
    		avgInfected: 49
    	},
    	{
    		state: "MO",
    		county: "Bates County",
    		avgInfected: 37.5
    	},
    	{
    		state: "MO",
    		county: "Benton County",
    		avgInfected: 59.25
    	},
    	{
    		state: "MO",
    		county: "Bollinger County",
    		avgInfected: 61.75
    	},
    	{
    		state: "MO",
    		county: "Boone County",
    		avgInfected: 781.5833333333334
    	},
    	{
    		state: "MO",
    		county: "Buchanan County",
    		avgInfected: 341.25
    	},
    	{
    		state: "MO",
    		county: "Butler County",
    		avgInfected: 157.58333333333334
    	},
    	{
    		state: "MO",
    		county: "Caldwell County",
    		avgInfected: 27.833333333333332
    	},
    	{
    		state: "MO",
    		county: "Callaway County",
    		avgInfected: 207.66666666666666
    	},
    	{
    		state: "MO",
    		county: "Camden County",
    		avgInfected: 187.66666666666666
    	},
    	{
    		state: "MO",
    		county: "Cape Girardeau County",
    		avgInfected: 367.25
    	},
    	{
    		state: "MO",
    		county: "Carroll County",
    		avgInfected: 29.416666666666668
    	},
    	{
    		state: "MO",
    		county: "Carter County",
    		avgInfected: 21.583333333333332
    	},
    	{
    		state: "MO",
    		county: "Cass County",
    		avgInfected: 273.4166666666667
    	},
    	{
    		state: "MO",
    		county: "Cedar County",
    		avgInfected: 34.25
    	},
    	{
    		state: "MO",
    		county: "Chariton County",
    		avgInfected: 17.833333333333332
    	},
    	{
    		state: "MO",
    		county: "Christian County",
    		avgInfected: 281.6666666666667
    	},
    	{
    		state: "MO",
    		county: "Clark County",
    		avgInfected: 21.666666666666668
    	},
    	{
    		state: "MO",
    		county: "Clay County",
    		avgInfected: 342.9166666666667
    	},
    	{
    		state: "MO",
    		county: "Clinton County",
    		avgInfected: 66.66666666666667
    	},
    	{
    		state: "MO",
    		county: "Cole County",
    		avgInfected: 452.1666666666667
    	},
    	{
    		state: "MO",
    		county: "Cooper County",
    		avgInfected: 88.5
    	},
    	{
    		state: "MO",
    		county: "Crawford County",
    		avgInfected: 88
    	},
    	{
    		state: "MO",
    		county: "Dade County",
    		avgInfected: 21.916666666666668
    	},
    	{
    		state: "MO",
    		county: "Dallas County",
    		avgInfected: 46.083333333333336
    	},
    	{
    		state: "MO",
    		county: "Daviess County",
    		avgInfected: 25.083333333333332
    	},
    	{
    		state: "MO",
    		county: "DeKalb County",
    		avgInfected: 41.333333333333336
    	},
    	{
    		state: "MO",
    		county: "Dent County",
    		avgInfected: 35.583333333333336
    	},
    	{
    		state: "MO",
    		county: "Douglas County",
    		avgInfected: 31.416666666666668
    	},
    	{
    		state: "MO",
    		county: "Dunklin County",
    		avgInfected: 129.83333333333334
    	},
    	{
    		state: "MO",
    		county: "Franklin County",
    		avgInfected: 353.9166666666667
    	},
    	{
    		state: "MO",
    		county: "Gasconade County",
    		avgInfected: 33.666666666666664
    	},
    	{
    		state: "MO",
    		county: "Gentry County",
    		avgInfected: 29.583333333333332
    	},
    	{
    		state: "MO",
    		county: "Greene County",
    		avgInfected: 1044.25
    	},
    	{
    		state: "MO",
    		county: "Grundy County",
    		avgInfected: 38.25
    	},
    	{
    		state: "MO",
    		county: "Harrison County",
    		avgInfected: 29.166666666666668
    	},
    	{
    		state: "MO",
    		county: "Henry County",
    		avgInfected: 77.75
    	},
    	{
    		state: "MO",
    		county: "Hickory County",
    		avgInfected: 28.583333333333332
    	},
    	{
    		state: "MO",
    		county: "Holt County",
    		avgInfected: 18.833333333333332
    	},
    	{
    		state: "MO",
    		county: "Howard County",
    		avgInfected: 35.166666666666664
    	},
    	{
    		state: "MO",
    		county: "Howell County",
    		avgInfected: 124.91666666666667
    	},
    	{
    		state: "MO",
    		county: "Iron County",
    		avgInfected: 16.583333333333332
    	},
    	{
    		state: "MO",
    		county: "Jackson County (including other portions of Kansas City)",
    		avgInfected: 2989.25
    	},
    	{
    		state: "MO",
    		county: "Jasper County",
    		avgInfected: 629
    	},
    	{
    		state: "MO",
    		county: "Jefferson County",
    		avgInfected: 780.1666666666666
    	},
    	{
    		state: "MO",
    		county: "Johnson County",
    		avgInfected: 188.41666666666666
    	},
    	{
    		state: "MO",
    		county: "Knox County",
    		avgInfected: 10
    	},
    	{
    		state: "MO",
    		county: "Laclede County",
    		avgInfected: 136.41666666666666
    	},
    	{
    		state: "MO",
    		county: "Lafayette County",
    		avgInfected: 110.91666666666667
    	},
    	{
    		state: "MO",
    		county: "Lawrence County",
    		avgInfected: 145.16666666666666
    	},
    	{
    		state: "MO",
    		county: "Lewis County",
    		avgInfected: 33.666666666666664
    	},
    	{
    		state: "MO",
    		county: "Lincoln County",
    		avgInfected: 172.66666666666666
    	},
    	{
    		state: "MO",
    		county: "Linn County",
    		avgInfected: 23.333333333333332
    	},
    	{
    		state: "MO",
    		county: "Livingston County",
    		avgInfected: 59.5
    	},
    	{
    		state: "MO",
    		county: "McDonald County",
    		avgInfected: 111.66666666666667
    	},
    	{
    		state: "MO",
    		county: "Macon County",
    		avgInfected: 45.333333333333336
    	},
    	{
    		state: "MO",
    		county: "Madison County",
    		avgInfected: 61.333333333333336
    	},
    	{
    		state: "MO",
    		county: "Maries County",
    		avgInfected: 27
    	},
    	{
    		state: "MO",
    		county: "Marion County",
    		avgInfected: 129.08333333333334
    	},
    	{
    		state: "MO",
    		county: "Mercer County",
    		avgInfected: 5.666666666666667
    	},
    	{
    		state: "MO",
    		county: "Miller County",
    		avgInfected: 114.08333333333333
    	},
    	{
    		state: "MO",
    		county: "Mississippi County",
    		avgInfected: 57
    	},
    	{
    		state: "MO",
    		county: "Moniteau County",
    		avgInfected: 92.5
    	},
    	{
    		state: "MO",
    		county: "Monroe County",
    		avgInfected: 27.166666666666668
    	},
    	{
    		state: "MO",
    		county: "Montgomery County",
    		avgInfected: 23.916666666666668
    	},
    	{
    		state: "MO",
    		county: "Morgan County",
    		avgInfected: 81
    	},
    	{
    		state: "MO",
    		county: "New Madrid County",
    		avgInfected: 100.33333333333333
    	},
    	{
    		state: "MO",
    		county: "Newton County",
    		avgInfected: 230.5
    	},
    	{
    		state: "MO",
    		county: "Nodaway County",
    		avgInfected: 119.41666666666667
    	},
    	{
    		state: "MO",
    		county: "Oregon County",
    		avgInfected: 28.583333333333332
    	},
    	{
    		state: "MO",
    		county: "Osage County",
    		avgInfected: 70
    	},
    	{
    		state: "MO",
    		county: "Ozark County",
    		avgInfected: 22.166666666666668
    	},
    	{
    		state: "MO",
    		county: "Pemiscot County",
    		avgInfected: 83.58333333333333
    	},
    	{
    		state: "MO",
    		county: "Perry County",
    		avgInfected: 114.33333333333333
    	},
    	{
    		state: "MO",
    		county: "Pettis County",
    		avgInfected: 210.08333333333334
    	},
    	{
    		state: "MO",
    		county: "Phelps County",
    		avgInfected: 120.75
    	},
    	{
    		state: "MO",
    		county: "Pike County",
    		avgInfected: 63.916666666666664
    	},
    	{
    		state: "MO",
    		county: "Platte County",
    		avgInfected: 121.58333333333333
    	},
    	{
    		state: "MO",
    		county: "Polk County",
    		avgInfected: 107.66666666666667
    	},
    	{
    		state: "MO",
    		county: "Pulaski County",
    		avgInfected: 118.16666666666667
    	},
    	{
    		state: "MO",
    		county: "Putnam County",
    		avgInfected: 9.083333333333334
    	},
    	{
    		state: "MO",
    		county: "Ralls County",
    		avgInfected: 32.75
    	},
    	{
    		state: "MO",
    		county: "Randolph County",
    		avgInfected: 89.58333333333333
    	},
    	{
    		state: "MO",
    		county: "Ray County",
    		avgInfected: 50.166666666666664
    	},
    	{
    		state: "MO",
    		county: "Reynolds County",
    		avgInfected: 12.666666666666666
    	},
    	{
    		state: "MO",
    		county: "Ripley County",
    		avgInfected: 37.333333333333336
    	},
    	{
    		state: "MO",
    		county: "St. Charles County",
    		avgInfected: 1444
    	},
    	{
    		state: "MO",
    		county: "St. Clair County",
    		avgInfected: 23.5
    	},
    	{
    		state: "MO",
    		county: "Ste. Genevieve County",
    		avgInfected: 75.75
    	},
    	{
    		state: "MO",
    		county: "St. Francois County",
    		avgInfected: 374.9166666666667
    	},
    	{
    		state: "MO",
    		county: "St. Louis County",
    		avgInfected: 3361.0833333333335
    	},
    	{
    		state: "MO",
    		county: "Saline County",
    		avgInfected: 120.16666666666667
    	},
    	{
    		state: "MO",
    		county: "Schuyler County",
    		avgInfected: 9.833333333333334
    	},
    	{
    		state: "MO",
    		county: "Scotland County",
    		avgInfected: 14
    	},
    	{
    		state: "MO",
    		county: "Scott County",
    		avgInfected: 193.83333333333334
    	},
    	{
    		state: "MO",
    		county: "Shannon County",
    		avgInfected: 26.666666666666668
    	},
    	{
    		state: "MO",
    		county: "Shelby County",
    		avgInfected: 14.333333333333334
    	},
    	{
    		state: "MO",
    		county: "Stoddard County",
    		avgInfected: 118.16666666666667
    	},
    	{
    		state: "MO",
    		county: "Stone County",
    		avgInfected: 88.16666666666667
    	},
    	{
    		state: "MO",
    		county: "Sullivan County",
    		avgInfected: 43.833333333333336
    	},
    	{
    		state: "MO",
    		county: "Taney County",
    		avgInfected: 210.25
    	},
    	{
    		state: "MO",
    		county: "Texas County",
    		avgInfected: 73.33333333333333
    	},
    	{
    		state: "MO",
    		county: "Vernon County",
    		avgInfected: 49.166666666666664
    	},
    	{
    		state: "MO",
    		county: "Warren County",
    		avgInfected: 85.83333333333333
    	},
    	{
    		state: "MO",
    		county: "Washington County",
    		avgInfected: 104.66666666666667
    	},
    	{
    		state: "MO",
    		county: "Wayne County",
    		avgInfected: 36.75
    	},
    	{
    		state: "MO",
    		county: "Webster County",
    		avgInfected: 137
    	},
    	{
    		state: "MO",
    		county: "Worth County",
    		avgInfected: 4.833333333333333
    	},
    	{
    		state: "MO",
    		county: "Wright County",
    		avgInfected: 59.75
    	},
    	{
    		state: "MO",
    		county: "City of St. Louis",
    		avgInfected: 903.6666666666666
    	},
    	{
    		state: "MT",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "MT",
    		county: "Beaverhead County",
    		avgInfected: 40.75
    	},
    	{
    		state: "MT",
    		county: "Big Horn County",
    		avgInfected: 144.41666666666666
    	},
    	{
    		state: "MT",
    		county: "Blaine County",
    		avgInfected: 39.583333333333336
    	},
    	{
    		state: "MT",
    		county: "Broadwater County",
    		avgInfected: 12.583333333333334
    	},
    	{
    		state: "MT",
    		county: "Carbon County",
    		avgInfected: 42.5
    	},
    	{
    		state: "MT",
    		county: "Carter County",
    		avgInfected: 8.333333333333334
    	},
    	{
    		state: "MT",
    		county: "Cascade County",
    		avgInfected: 362
    	},
    	{
    		state: "MT",
    		county: "Chouteau County",
    		avgInfected: 18.416666666666668
    	},
    	{
    		state: "MT",
    		county: "Custer County",
    		avgInfected: 51.666666666666664
    	},
    	{
    		state: "MT",
    		county: "Daniels County",
    		avgInfected: 7.333333333333333
    	},
    	{
    		state: "MT",
    		county: "Dawson County",
    		avgInfected: 41
    	},
    	{
    		state: "MT",
    		county: "Deer Lodge County",
    		avgInfected: 52.666666666666664
    	},
    	{
    		state: "MT",
    		county: "Fallon County",
    		avgInfected: 16.666666666666668
    	},
    	{
    		state: "MT",
    		county: "Fergus County",
    		avgInfected: 38.916666666666664
    	},
    	{
    		state: "MT",
    		county: "Flathead County",
    		avgInfected: 457.3333333333333
    	},
    	{
    		state: "MT",
    		county: "Gallatin County",
    		avgInfected: 519.4166666666666
    	},
    	{
    		state: "MT",
    		county: "Garfield County",
    		avgInfected: 4.583333333333333
    	},
    	{
    		state: "MT",
    		county: "Glacier County",
    		avgInfected: 95.41666666666667
    	},
    	{
    		state: "MT",
    		county: "Golden Valley County",
    		avgInfected: 1.8333333333333333
    	},
    	{
    		state: "MT",
    		county: "Granite County",
    		avgInfected: 9.333333333333334
    	},
    	{
    		state: "MT",
    		county: "Hill County",
    		avgInfected: 99.33333333333333
    	},
    	{
    		state: "MT",
    		county: "Jefferson County",
    		avgInfected: 30.916666666666668
    	},
    	{
    		state: "MT",
    		county: "Judith Basin County",
    		avgInfected: 3.8333333333333335
    	},
    	{
    		state: "MT",
    		county: "Lake County",
    		avgInfected: 72.16666666666667
    	},
    	{
    		state: "MT",
    		county: "Lewis and Clark County",
    		avgInfected: 170.66666666666666
    	},
    	{
    		state: "MT",
    		county: "Liberty County",
    		avgInfected: 4.916666666666667
    	},
    	{
    		state: "MT",
    		county: "Lincoln County",
    		avgInfected: 51.666666666666664
    	},
    	{
    		state: "MT",
    		county: "McCone County",
    		avgInfected: 6.75
    	},
    	{
    		state: "MT",
    		county: "Madison County",
    		avgInfected: 29.416666666666668
    	},
    	{
    		state: "MT",
    		county: "Meagher County",
    		avgInfected: 8.5
    	},
    	{
    		state: "MT",
    		county: "Mineral County",
    		avgInfected: 2.6666666666666665
    	},
    	{
    		state: "MT",
    		county: "Missoula County",
    		avgInfected: 318.25
    	},
    	{
    		state: "MT",
    		county: "Musselshell County",
    		avgInfected: 15.5
    	},
    	{
    		state: "MT",
    		county: "Park County",
    		avgInfected: 41
    	},
    	{
    		state: "MT",
    		county: "Petroleum County",
    		avgInfected: 0.4166666666666667
    	},
    	{
    		state: "MT",
    		county: "Phillips County",
    		avgInfected: 20
    	},
    	{
    		state: "MT",
    		county: "Pondera County",
    		avgInfected: 21.5
    	},
    	{
    		state: "MT",
    		county: "Powder River County",
    		avgInfected: 6.583333333333333
    	},
    	{
    		state: "MT",
    		county: "Powell County",
    		avgInfected: 32.75
    	},
    	{
    		state: "MT",
    		county: "Prairie County",
    		avgInfected: 5
    	},
    	{
    		state: "MT",
    		county: "Ravalli County",
    		avgInfected: 76.66666666666667
    	},
    	{
    		state: "MT",
    		county: "Richland County",
    		avgInfected: 40.833333333333336
    	},
    	{
    		state: "MT",
    		county: "Roosevelt County",
    		avgInfected: 97.08333333333333
    	},
    	{
    		state: "MT",
    		county: "Rosebud County",
    		avgInfected: 69.41666666666667
    	},
    	{
    		state: "MT",
    		county: "Sanders County",
    		avgInfected: 15.416666666666666
    	},
    	{
    		state: "MT",
    		county: "Sheridan County",
    		avgInfected: 18.666666666666668
    	},
    	{
    		state: "MT",
    		county: "Silver Bow County",
    		avgInfected: 125.5
    	},
    	{
    		state: "MT",
    		county: "Stillwater County",
    		avgInfected: 31.25
    	},
    	{
    		state: "MT",
    		county: "Sweet Grass County",
    		avgInfected: 17.333333333333332
    	},
    	{
    		state: "MT",
    		county: "Teton County",
    		avgInfected: 12.833333333333334
    	},
    	{
    		state: "MT",
    		county: "Toole County",
    		avgInfected: 47.833333333333336
    	},
    	{
    		state: "MT",
    		county: "Treasure County",
    		avgInfected: 2.3333333333333335
    	},
    	{
    		state: "MT",
    		county: "Valley County",
    		avgInfected: 42.25
    	},
    	{
    		state: "MT",
    		county: "Wheatland County",
    		avgInfected: 7.833333333333333
    	},
    	{
    		state: "MT",
    		county: "Wibaux County",
    		avgInfected: 6.083333333333333
    	},
    	{
    		state: "MT",
    		county: "Yellowstone County",
    		avgInfected: 800.25
    	},
    	{
    		state: "NE",
    		county: "Statewide Unallocated",
    		avgInfected: 0.16666666666666666
    	},
    	{
    		state: "NE",
    		county: "Adams County",
    		avgInfected: 113.75
    	},
    	{
    		state: "NE",
    		county: "Antelope County",
    		avgInfected: 24.166666666666668
    	},
    	{
    		state: "NE",
    		county: "Arthur County",
    		avgInfected: 1.0833333333333333
    	},
    	{
    		state: "NE",
    		county: "Banner County",
    		avgInfected: 1
    	},
    	{
    		state: "NE",
    		county: "Blaine County",
    		avgInfected: 1.1666666666666667
    	},
    	{
    		state: "NE",
    		county: "Boone County",
    		avgInfected: 22.666666666666668
    	},
    	{
    		state: "NE",
    		county: "Box Butte County",
    		avgInfected: 42.166666666666664
    	},
    	{
    		state: "NE",
    		county: "Boyd County",
    		avgInfected: 9.25
    	},
    	{
    		state: "NE",
    		county: "Brown County",
    		avgInfected: 12.333333333333334
    	},
    	{
    		state: "NE",
    		county: "Buffalo County",
    		avgInfected: 258.8333333333333
    	},
    	{
    		state: "NE",
    		county: "Burt County",
    		avgInfected: 28.833333333333332
    	},
    	{
    		state: "NE",
    		county: "Butler County",
    		avgInfected: 39
    	},
    	{
    		state: "NE",
    		county: "Cass County",
    		avgInfected: 80.66666666666667
    	},
    	{
    		state: "NE",
    		county: "Cedar County",
    		avgInfected: 24.833333333333332
    	},
    	{
    		state: "NE",
    		county: "Chase County",
    		avgInfected: 20.083333333333332
    	},
    	{
    		state: "NE",
    		county: "Cherry County",
    		avgInfected: 13.25
    	},
    	{
    		state: "NE",
    		county: "Cheyenne County",
    		avgInfected: 32.166666666666664
    	},
    	{
    		state: "NE",
    		county: "Clay County",
    		avgInfected: 26.666666666666668
    	},
    	{
    		state: "NE",
    		county: "Colfax County",
    		avgInfected: 101.25
    	},
    	{
    		state: "NE",
    		county: "Cuming County",
    		avgInfected: 43.916666666666664
    	},
    	{
    		state: "NE",
    		county: "Custer County",
    		avgInfected: 33
    	},
    	{
    		state: "NE",
    		county: "Dakota County",
    		avgInfected: 246.66666666666666
    	},
    	{
    		state: "NE",
    		county: "Dawes County",
    		avgInfected: 34.583333333333336
    	},
    	{
    		state: "NE",
    		county: "Dawson County",
    		avgInfected: 149.16666666666666
    	},
    	{
    		state: "NE",
    		county: "Deuel County",
    		avgInfected: 2.5833333333333335
    	},
    	{
    		state: "NE",
    		county: "Dixon County",
    		avgInfected: 27.75
    	},
    	{
    		state: "NE",
    		county: "Dodge County",
    		avgInfected: 208.41666666666666
    	},
    	{
    		state: "NE",
    		county: "Douglas County",
    		avgInfected: 2890
    	},
    	{
    		state: "NE",
    		county: "Dundy County",
    		avgInfected: 4.25
    	},
    	{
    		state: "NE",
    		county: "Fillmore County",
    		avgInfected: 23.083333333333332
    	},
    	{
    		state: "NE",
    		county: "Franklin County",
    		avgInfected: 12.75
    	},
    	{
    		state: "NE",
    		county: "Frontier County",
    		avgInfected: 7.666666666666667
    	},
    	{
    		state: "NE",
    		county: "Furnas County",
    		avgInfected: 17.5
    	},
    	{
    		state: "NE",
    		county: "Gage County",
    		avgInfected: 91.83333333333333
    	},
    	{
    		state: "NE",
    		county: "Garden County",
    		avgInfected: 5.75
    	},
    	{
    		state: "NE",
    		county: "Garfield County",
    		avgInfected: 7.083333333333333
    	},
    	{
    		state: "NE",
    		county: "Gosper County",
    		avgInfected: 8.333333333333334
    	},
    	{
    		state: "NE",
    		county: "Grant County",
    		avgInfected: 1.25
    	},
    	{
    		state: "NE",
    		county: "Greeley County",
    		avgInfected: 8.25
    	},
    	{
    		state: "NE",
    		county: "Hall County",
    		avgInfected: 330.8333333333333
    	},
    	{
    		state: "NE",
    		county: "Hamilton County",
    		avgInfected: 37.5
    	},
    	{
    		state: "NE",
    		county: "Harlan County",
    		avgInfected: 9.416666666666666
    	},
    	{
    		state: "NE",
    		county: "Hayes County",
    		avgInfected: 3.0833333333333335
    	},
    	{
    		state: "NE",
    		county: "Hitchcock County",
    		avgInfected: 6.833333333333333
    	},
    	{
    		state: "NE",
    		county: "Holt County",
    		avgInfected: 40
    	},
    	{
    		state: "NE",
    		county: "Hooker County",
    		avgInfected: 3.5
    	},
    	{
    		state: "NE",
    		county: "Howard County",
    		avgInfected: 23.666666666666668
    	},
    	{
    		state: "NE",
    		county: "Jefferson County",
    		avgInfected: 22.666666666666668
    	},
    	{
    		state: "NE",
    		county: "Johnson County",
    		avgInfected: 24.583333333333332
    	},
    	{
    		state: "NE",
    		county: "Kearney County",
    		avgInfected: 36.583333333333336
    	},
    	{
    		state: "NE",
    		county: "Keith County",
    		avgInfected: 23.75
    	},
    	{
    		state: "NE",
    		county: "Keya Paha County",
    		avgInfected: 1.4166666666666667
    	},
    	{
    		state: "NE",
    		county: "Kimball County",
    		avgInfected: 12
    	},
    	{
    		state: "NE",
    		county: "Knox County",
    		avgInfected: 31.916666666666668
    	},
    	{
    		state: "NE",
    		county: "Lancaster County",
    		avgInfected: 1149.75
    	},
    	{
    		state: "NE",
    		county: "Lincoln County",
    		avgInfected: 160.75
    	},
    	{
    		state: "NE",
    		county: "Logan County",
    		avgInfected: 2.5
    	},
    	{
    		state: "NE",
    		county: "Loup County",
    		avgInfected: 2.25
    	},
    	{
    		state: "NE",
    		county: "McPherson County",
    		avgInfected: 1.25
    	},
    	{
    		state: "NE",
    		county: "Madison County",
    		avgInfected: 227.75
    	},
    	{
    		state: "NE",
    		county: "Merrick County",
    		avgInfected: 31.583333333333332
    	},
    	{
    		state: "NE",
    		county: "Morrill County",
    		avgInfected: 22.833333333333332
    	},
    	{
    		state: "NE",
    		county: "Nance County",
    		avgInfected: 18.083333333333332
    	},
    	{
    		state: "NE",
    		county: "Nemaha County",
    		avgInfected: 22.833333333333332
    	},
    	{
    		state: "NE",
    		county: "Nuckolls County",
    		avgInfected: 14.166666666666666
    	},
    	{
    		state: "NE",
    		county: "Otoe County",
    		avgInfected: 54.25
    	},
    	{
    		state: "NE",
    		county: "Pawnee County",
    		avgInfected: 5.083333333333333
    	},
    	{
    		state: "NE",
    		county: "Perkins County",
    		avgInfected: 9.5
    	},
    	{
    		state: "NE",
    		county: "Phelps County",
    		avgInfected: 39.666666666666664
    	},
    	{
    		state: "NE",
    		county: "Pierce County",
    		avgInfected: 31
    	},
    	{
    		state: "NE",
    		county: "Platte County",
    		avgInfected: 232.66666666666666
    	},
    	{
    		state: "NE",
    		county: "Polk County",
    		avgInfected: 23.666666666666668
    	},
    	{
    		state: "NE",
    		county: "Red Willow County",
    		avgInfected: 41.666666666666664
    	},
    	{
    		state: "NE",
    		county: "Richardson County",
    		avgInfected: 22.5
    	},
    	{
    		state: "NE",
    		county: "Rock County",
    		avgInfected: 6.25
    	},
    	{
    		state: "NE",
    		county: "Saline County",
    		avgInfected: 110.83333333333333
    	},
    	{
    		state: "NE",
    		county: "Sarpy County",
    		avgInfected: 819.25
    	},
    	{
    		state: "NE",
    		county: "Saunders County",
    		avgInfected: 89.58333333333333
    	},
    	{
    		state: "NE",
    		county: "Scotts Bluff County",
    		avgInfected: 204.41666666666666
    	},
    	{
    		state: "NE",
    		county: "Seward County",
    		avgInfected: 59.25
    	},
    	{
    		state: "NE",
    		county: "Sheridan County",
    		avgInfected: 21.25
    	},
    	{
    		state: "NE",
    		county: "Sherman County",
    		avgInfected: 8.75
    	},
    	{
    		state: "NE",
    		county: "Sioux County",
    		avgInfected: 1.5
    	},
    	{
    		state: "NE",
    		county: "Stanton County",
    		avgInfected: 14.333333333333334
    	},
    	{
    		state: "NE",
    		county: "Thayer County",
    		avgInfected: 16.25
    	},
    	{
    		state: "NE",
    		county: "Thomas County",
    		avgInfected: 2.25
    	},
    	{
    		state: "NE",
    		county: "Thurston County",
    		avgInfected: 42.083333333333336
    	},
    	{
    		state: "NE",
    		county: "Valley County",
    		avgInfected: 13.5
    	},
    	{
    		state: "NE",
    		county: "Washington County",
    		avgInfected: 80.75
    	},
    	{
    		state: "NE",
    		county: "Wayne County",
    		avgInfected: 55
    	},
    	{
    		state: "NE",
    		county: "Webster County",
    		avgInfected: 13.75
    	},
    	{
    		state: "NE",
    		county: "Wheeler County",
    		avgInfected: 0.9166666666666666
    	},
    	{
    		state: "NE",
    		county: "York County",
    		avgInfected: 71.91666666666667
    	},
    	{
    		state: "NV",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "NV",
    		county: "Churchill County",
    		avgInfected: 51.583333333333336
    	},
    	{
    		state: "NV",
    		county: "Clark County",
    		avgInfected: 8379.333333333334
    	},
    	{
    		state: "NV",
    		county: "Douglas County",
    		avgInfected: 41.75
    	},
    	{
    		state: "NV",
    		county: "Elko County",
    		avgInfected: 181.08333333333334
    	},
    	{
    		state: "NV",
    		county: "Esmeralda County",
    		avgInfected: 0.4166666666666667
    	},
    	{
    		state: "NV",
    		county: "Eureka County",
    		avgInfected: 1.8333333333333333
    	},
    	{
    		state: "NV",
    		county: "Humboldt County",
    		avgInfected: 20.416666666666668
    	},
    	{
    		state: "NV",
    		county: "Lander County",
    		avgInfected: 12.416666666666666
    	},
    	{
    		state: "NV",
    		county: "Lincoln County",
    		avgInfected: 13.5
    	},
    	{
    		state: "NV",
    		county: "Lyon County",
    		avgInfected: 61.583333333333336
    	},
    	{
    		state: "NV",
    		county: "Mineral County",
    		avgInfected: 5.083333333333333
    	},
    	{
    		state: "NV",
    		county: "Nye County",
    		avgInfected: 90.66666666666667
    	},
    	{
    		state: "NV",
    		county: "Pershing County",
    		avgInfected: 3.8333333333333335
    	},
    	{
    		state: "NV",
    		county: "Storey County",
    		avgInfected: 2.5
    	},
    	{
    		state: "NV",
    		county: "Washoe County",
    		avgInfected: 1645.1666666666667
    	},
    	{
    		state: "NV",
    		county: "White Pine County",
    		avgInfected: 18.166666666666668
    	},
    	{
    		state: "NV",
    		county: "Carson City",
    		avgInfected: 60.5
    	},
    	{
    		state: "NH",
    		county: "Statewide Unallocated",
    		avgInfected: 20.916666666666668
    	},
    	{
    		state: "NH",
    		county: "Belknap County",
    		avgInfected: 40.5
    	},
    	{
    		state: "NH",
    		county: "Carroll County",
    		avgInfected: 21.916666666666668
    	},
    	{
    		state: "NH",
    		county: "Cheshire County",
    		avgInfected: 31.416666666666668
    	},
    	{
    		state: "NH",
    		county: "Coos County",
    		avgInfected: 22.166666666666668
    	},
    	{
    		state: "NH",
    		county: "Grafton County",
    		avgInfected: 37.083333333333336
    	},
    	{
    		state: "NH",
    		county: "Hillsborough County",
    		avgInfected: 616.4166666666666
    	},
    	{
    		state: "NH",
    		county: "Merrimack County",
    		avgInfected: 115.5
    	},
    	{
    		state: "NH",
    		county: "Rockingham County",
    		avgInfected: 326.6666666666667
    	},
    	{
    		state: "NH",
    		county: "Strafford County",
    		avgInfected: 108.58333333333333
    	},
    	{
    		state: "NH",
    		county: "Sullivan County",
    		avgInfected: 15.25
    	},
    	{
    		state: "NJ",
    		county: "Statewide Unallocated",
    		avgInfected: 61.166666666666664
    	},
    	{
    		state: "NJ",
    		county: "Atlantic County",
    		avgInfected: 576.6666666666666
    	},
    	{
    		state: "NJ",
    		county: "Bergen County",
    		avgInfected: 2555.5
    	},
    	{
    		state: "NJ",
    		county: "Burlington County",
    		avgInfected: 935.4166666666666
    	},
    	{
    		state: "NJ",
    		county: "Camden County",
    		avgInfected: 1319.1666666666667
    	},
    	{
    		state: "NJ",
    		county: "Cape May County",
    		avgInfected: 121
    	},
    	{
    		state: "NJ",
    		county: "Cumberland County",
    		avgInfected: 381.9166666666667
    	},
    	{
    		state: "NJ",
    		county: "Essex County",
    		avgInfected: 2630.0833333333335
    	},
    	{
    		state: "NJ",
    		county: "Gloucester County",
    		avgInfected: 632.4166666666666
    	},
    	{
    		state: "NJ",
    		county: "Hudson County",
    		avgInfected: 2340.8333333333335
    	},
    	{
    		state: "NJ",
    		county: "Hunterdon County",
    		avgInfected: 176.58333333333334
    	},
    	{
    		state: "NJ",
    		county: "Mercer County",
    		avgInfected: 988.75
    	},
    	{
    		state: "NJ",
    		county: "Middlesex County",
    		avgInfected: 2263.25
    	},
    	{
    		state: "NJ",
    		county: "Monmouth County",
    		avgInfected: 1477.0833333333333
    	},
    	{
    		state: "NJ",
    		county: "Morris County",
    		avgInfected: 980
    	},
    	{
    		state: "NJ",
    		county: "Ocean County",
    		avgInfected: 1616.0833333333333
    	},
    	{
    		state: "NJ",
    		county: "Passaic County",
    		avgInfected: 2169.3333333333335
    	},
    	{
    		state: "NJ",
    		county: "Salem County",
    		avgInfected: 118.75
    	},
    	{
    		state: "NJ",
    		county: "Somerset County",
    		avgInfected: 671.5
    	},
    	{
    		state: "NJ",
    		county: "Sussex County",
    		avgInfected: 184.08333333333334
    	},
    	{
    		state: "NJ",
    		county: "Union County",
    		avgInfected: 2102.9166666666665
    	},
    	{
    		state: "NJ",
    		county: "Warren County",
    		avgInfected: 179.33333333333334
    	},
    	{
    		state: "NM",
    		county: "Statewide Unallocated",
    		avgInfected: 201.33333333333334
    	},
    	{
    		state: "NM",
    		county: "Bernalillo County",
    		avgInfected: 1628.4166666666667
    	},
    	{
    		state: "NM",
    		county: "Catron County",
    		avgInfected: 2.0833333333333335
    	},
    	{
    		state: "NM",
    		county: "Chaves County",
    		avgInfected: 296.9166666666667
    	},
    	{
    		state: "NM",
    		county: "Cibola County",
    		avgInfected: 99.16666666666667
    	},
    	{
    		state: "NM",
    		county: "Colfax County",
    		avgInfected: 9.916666666666666
    	},
    	{
    		state: "NM",
    		county: "Curry County",
    		avgInfected: 216.75
    	},
    	{
    		state: "NM",
    		county: "De Baca County",
    		avgInfected: 2.25
    	},
    	{
    		state: "NM",
    		county: "Dona Ana County",
    		avgInfected: 940.75
    	},
    	{
    		state: "NM",
    		county: "Eddy County",
    		avgInfected: 197
    	},
    	{
    		state: "NM",
    		county: "Grant County",
    		avgInfected: 30.5
    	},
    	{
    		state: "NM",
    		county: "Guadalupe County",
    		avgInfected: 7.583333333333333
    	},
    	{
    		state: "NM",
    		county: "Harding County",
    		avgInfected: 0.3333333333333333
    	},
    	{
    		state: "NM",
    		county: "Hidalgo County",
    		avgInfected: 12.833333333333334
    	},
    	{
    		state: "NM",
    		county: "Lea County",
    		avgInfected: 281.5
    	},
    	{
    		state: "NM",
    		county: "Lincoln County",
    		avgInfected: 48.75
    	},
    	{
    		state: "NM",
    		county: "Los Alamos County",
    		avgInfected: 8.583333333333334
    	},
    	{
    		state: "NM",
    		county: "Luna County",
    		avgInfected: 138.91666666666666
    	},
    	{
    		state: "NM",
    		county: "McKinley County",
    		avgInfected: 470.5833333333333
    	},
    	{
    		state: "NM",
    		county: "Mora County",
    		avgInfected: 2.4166666666666665
    	},
    	{
    		state: "NM",
    		county: "Otero County",
    		avgInfected: 86.41666666666667
    	},
    	{
    		state: "NM",
    		county: "Quay County",
    		avgInfected: 14.083333333333334
    	},
    	{
    		state: "NM",
    		county: "Rio Arriba County",
    		avgInfected: 80.58333333333333
    	},
    	{
    		state: "NM",
    		county: "Roosevelt County",
    		avgInfected: 66.08333333333333
    	},
    	{
    		state: "NM",
    		county: "Sandoval County",
    		avgInfected: 300.5
    	},
    	{
    		state: "NM",
    		county: "San Juan County",
    		avgInfected: 392.25
    	},
    	{
    		state: "NM",
    		county: "San Miguel County",
    		avgInfected: 27.333333333333332
    	},
    	{
    		state: "NM",
    		county: "Santa Fe County",
    		avgInfected: 317.3333333333333
    	},
    	{
    		state: "NM",
    		county: "Sierra County",
    		avgInfected: 18.333333333333332
    	},
    	{
    		state: "NM",
    		county: "Socorro County",
    		avgInfected: 39.333333333333336
    	},
    	{
    		state: "NM",
    		county: "Taos County",
    		avgInfected: 49.083333333333336
    	},
    	{
    		state: "NM",
    		county: "Torrance County",
    		avgInfected: 16.333333333333332
    	},
    	{
    		state: "NM",
    		county: "Union County",
    		avgInfected: 6.583333333333333
    	},
    	{
    		state: "NM",
    		county: "Valencia County",
    		avgInfected: 165.5
    	},
    	{
    		state: "NY",
    		county: "Statewide Unallocated",
    		avgInfected: 5.75
    	},
    	{
    		state: "NY",
    		county: "New York City Unallocated/Probable",
    		avgInfected: 0
    	},
    	{
    		state: "NY",
    		county: "Albany County",
    		avgInfected: 401.8333333333333
    	},
    	{
    		state: "NY",
    		county: "Allegany County",
    		avgInfected: 59.083333333333336
    	},
    	{
    		state: "NY",
    		county: "Bronx County",
    		avgInfected: 4988
    	},
    	{
    		state: "NY",
    		county: "Broome County",
    		avgInfected: 385
    	},
    	{
    		state: "NY",
    		county: "Cattaraugus County",
    		avgInfected: 65
    	},
    	{
    		state: "NY",
    		county: "Cayuga County",
    		avgInfected: 56.333333333333336
    	},
    	{
    		state: "NY",
    		county: "Chautauqua County",
    		avgInfected: 109.66666666666667
    	},
    	{
    		state: "NY",
    		county: "Chemung County",
    		avgInfected: 207.25
    	},
    	{
    		state: "NY",
    		county: "Chenango County",
    		avgInfected: 44.25
    	},
    	{
    		state: "NY",
    		county: "Clinton County",
    		avgInfected: 33.083333333333336
    	},
    	{
    		state: "NY",
    		county: "Columbia County",
    		avgInfected: 76.5
    	},
    	{
    		state: "NY",
    		county: "Cortland County",
    		avgInfected: 68.91666666666667
    	},
    	{
    		state: "NY",
    		county: "Delaware County",
    		avgInfected: 24.25
    	},
    	{
    		state: "NY",
    		county: "Dutchess County",
    		avgInfected: 536.5833333333334
    	},
    	{
    		state: "NY",
    		county: "Erie County",
    		avgInfected: 1622.75
    	},
    	{
    		state: "NY",
    		county: "Essex County",
    		avgInfected: 19.916666666666668
    	},
    	{
    		state: "NY",
    		county: "Franklin County",
    		avgInfected: 17.916666666666668
    	},
    	{
    		state: "NY",
    		county: "Fulton County",
    		avgInfected: 34.583333333333336
    	},
    	{
    		state: "NY",
    		county: "Genesee County",
    		avgInfected: 56.166666666666664
    	},
    	{
    		state: "NY",
    		county: "Greene County",
    		avgInfected: 50
    	},
    	{
    		state: "NY",
    		county: "Hamilton County",
    		avgInfected: 2.9166666666666665
    	},
    	{
    		state: "NY",
    		county: "Herkimer County",
    		avgInfected: 44.75
    	},
    	{
    		state: "NY",
    		county: "Jefferson County",
    		avgInfected: 29.5
    	},
    	{
    		state: "NY",
    		county: "Kings County",
    		avgInfected: 6923.583333333333
    	},
    	{
    		state: "NY",
    		county: "Lewis County",
    		avgInfected: 22.916666666666668
    	},
    	{
    		state: "NY",
    		county: "Livingston County",
    		avgInfected: 45.166666666666664
    	},
    	{
    		state: "NY",
    		county: "Madison County",
    		avgInfected: 63.833333333333336
    	},
    	{
    		state: "NY",
    		county: "Monroe County",
    		avgInfected: 953.6666666666666
    	},
    	{
    		state: "NY",
    		county: "Montgomery County",
    		avgInfected: 30.166666666666668
    	},
    	{
    		state: "NY",
    		county: "Nassau County",
    		avgInfected: 4623.833333333333
    	},
    	{
    		state: "NY",
    		county: "New York County",
    		avgInfected: 3438.5833333333335
    	},
    	{
    		state: "NY",
    		county: "Niagara County",
    		avgInfected: 244.5
    	},
    	{
    		state: "NY",
    		county: "Oneida County",
    		avgInfected: 320.5
    	},
    	{
    		state: "NY",
    		county: "Onondaga County",
    		avgInfected: 707.8333333333334
    	},
    	{
    		state: "NY",
    		county: "Ontario County",
    		avgInfected: 85.16666666666667
    	},
    	{
    		state: "NY",
    		county: "Orange County",
    		avgInfected: 1297.1666666666667
    	},
    	{
    		state: "NY",
    		county: "Orleans County",
    		avgInfected: 45.666666666666664
    	},
    	{
    		state: "NY",
    		county: "Oswego County",
    		avgInfected: 90.08333333333333
    	},
    	{
    		state: "NY",
    		county: "Otsego County",
    		avgInfected: 41
    	},
    	{
    		state: "NY",
    		county: "Putnam County",
    		avgInfected: 192.16666666666666
    	},
    	{
    		state: "NY",
    		county: "Queens County",
    		avgInfected: 7022.416666666667
    	},
    	{
    		state: "NY",
    		county: "Rensselaer County",
    		avgInfected: 117.58333333333333
    	},
    	{
    		state: "NY",
    		county: "Richmond County",
    		avgInfected: 1699.8333333333333
    	},
    	{
    		state: "NY",
    		county: "Rockland County",
    		avgInfected: 1688.5833333333333
    	},
    	{
    		state: "NY",
    		county: "St. Lawrence County",
    		avgInfected: 52.25
    	},
    	{
    		state: "NY",
    		county: "Saratoga County",
    		avgInfected: 150.33333333333334
    	},
    	{
    		state: "NY",
    		county: "Schenectady County",
    		avgInfected: 165.25
    	},
    	{
    		state: "NY",
    		county: "Schoharie County",
    		avgInfected: 13.5
    	},
    	{
    		state: "NY",
    		county: "Schuyler County",
    		avgInfected: 20.583333333333332
    	},
    	{
    		state: "NY",
    		county: "Seneca County",
    		avgInfected: 18.75
    	},
    	{
    		state: "NY",
    		county: "Steuben County",
    		avgInfected: 124
    	},
    	{
    		state: "NY",
    		county: "Suffolk County",
    		avgInfected: 4576.333333333333
    	},
    	{
    		state: "NY",
    		county: "Sullivan County",
    		avgInfected: 169.25
    	},
    	{
    		state: "NY",
    		county: "Tioga County",
    		avgInfected: 83
    	},
    	{
    		state: "NY",
    		county: "Tompkins County",
    		avgInfected: 70
    	},
    	{
    		state: "NY",
    		county: "Ulster County",
    		avgInfected: 244.75
    	},
    	{
    		state: "NY",
    		county: "Warren County",
    		avgInfected: 43.75
    	},
    	{
    		state: "NY",
    		county: "Washington County",
    		avgInfected: 34.25
    	},
    	{
    		state: "NY",
    		county: "Wayne County",
    		avgInfected: 71.16666666666667
    	},
    	{
    		state: "NY",
    		county: "Westchester County",
    		avgInfected: 3806
    	},
    	{
    		state: "NY",
    		county: "Wyoming County",
    		avgInfected: 31.833333333333332
    	},
    	{
    		state: "NY",
    		county: "Yates County",
    		avgInfected: 18.333333333333332
    	},
    	{
    		state: "NC",
    		county: "Statewide Unallocated",
    		avgInfected: 0.16666666666666666
    	},
    	{
    		state: "NC",
    		county: "Alamance County",
    		avgInfected: 531.9166666666666
    	},
    	{
    		state: "NC",
    		county: "Alexander County",
    		avgInfected: 115.16666666666667
    	},
    	{
    		state: "NC",
    		county: "Alleghany County",
    		avgInfected: 30.666666666666668
    	},
    	{
    		state: "NC",
    		county: "Anson County",
    		avgInfected: 70.33333333333333
    	},
    	{
    		state: "NC",
    		county: "Ashe County",
    		avgInfected: 57.416666666666664
    	},
    	{
    		state: "NC",
    		county: "Avery County",
    		avgInfected: 68.33333333333333
    	},
    	{
    		state: "NC",
    		county: "Beaufort County",
    		avgInfected: 131.83333333333334
    	},
    	{
    		state: "NC",
    		county: "Bertie County",
    		avgInfected: 68.33333333333333
    	},
    	{
    		state: "NC",
    		county: "Bladen County",
    		avgInfected: 102
    	},
    	{
    		state: "NC",
    		county: "Brunswick County",
    		avgInfected: 222.08333333333334
    	},
    	{
    		state: "NC",
    		county: "Buncombe County",
    		avgInfected: 419.0833333333333
    	},
    	{
    		state: "NC",
    		county: "Burke County",
    		avgInfected: 281.5
    	},
    	{
    		state: "NC",
    		county: "Cabarrus County",
    		avgInfected: 510.1666666666667
    	},
    	{
    		state: "NC",
    		county: "Caldwell County",
    		avgInfected: 263.5
    	},
    	{
    		state: "NC",
    		county: "Camden County",
    		avgInfected: 13.75
    	},
    	{
    		state: "NC",
    		county: "Carteret County",
    		avgInfected: 125.58333333333333
    	},
    	{
    		state: "NC",
    		county: "Caswell County",
    		avgInfected: 63.083333333333336
    	},
    	{
    		state: "NC",
    		county: "Catawba County",
    		avgInfected: 499.0833333333333
    	},
    	{
    		state: "NC",
    		county: "Chatham County",
    		avgInfected: 185.5
    	},
    	{
    		state: "NC",
    		county: "Cherokee County",
    		avgInfected: 73.33333333333333
    	},
    	{
    		state: "NC",
    		county: "Chowan County",
    		avgInfected: 48
    	},
    	{
    		state: "NC",
    		county: "Clay County",
    		avgInfected: 22.416666666666668
    	},
    	{
    		state: "NC",
    		county: "Cleveland County",
    		avgInfected: 323
    	},
    	{
    		state: "NC",
    		county: "Columbus County",
    		avgInfected: 193.83333333333334
    	},
    	{
    		state: "NC",
    		county: "Craven County",
    		avgInfected: 234.25
    	},
    	{
    		state: "NC",
    		county: "Cumberland County",
    		avgInfected: 711.4166666666666
    	},
    	{
    		state: "NC",
    		county: "Currituck County",
    		avgInfected: 24.666666666666668
    	},
    	{
    		state: "NC",
    		county: "Dare County",
    		avgInfected: 46.75
    	},
    	{
    		state: "NC",
    		county: "Davidson County",
    		avgInfected: 388.3333333333333
    	},
    	{
    		state: "NC",
    		county: "Davie County",
    		avgInfected: 86.91666666666667
    	},
    	{
    		state: "NC",
    		county: "Duplin County",
    		avgInfected: 261.5833333333333
    	},
    	{
    		state: "NC",
    		county: "Durham County",
    		avgInfected: 875.5833333333334
    	},
    	{
    		state: "NC",
    		county: "Edgecombe County",
    		avgInfected: 195.91666666666666
    	},
    	{
    		state: "NC",
    		county: "Forsyth County",
    		avgInfected: 959.3333333333334
    	},
    	{
    		state: "NC",
    		county: "Franklin County",
    		avgInfected: 147.08333333333334
    	},
    	{
    		state: "NC",
    		county: "Gaston County",
    		avgInfected: 770.9166666666666
    	},
    	{
    		state: "NC",
    		county: "Gates County",
    		avgInfected: 15.833333333333334
    	},
    	{
    		state: "NC",
    		county: "Graham County",
    		avgInfected: 22.333333333333332
    	},
    	{
    		state: "NC",
    		county: "Granville County",
    		avgInfected: 196
    	},
    	{
    		state: "NC",
    		county: "Greene County",
    		avgInfected: 92.66666666666667
    	},
    	{
    		state: "NC",
    		county: "Guilford County",
    		avgInfected: 1233.6666666666667
    	},
    	{
    		state: "NC",
    		county: "Halifax County",
    		avgInfected: 149.75
    	},
    	{
    		state: "NC",
    		county: "Harnett County",
    		avgInfected: 296.5833333333333
    	},
    	{
    		state: "NC",
    		county: "Haywood County",
    		avgInfected: 79
    	},
    	{
    		state: "NC",
    		county: "Henderson County",
    		avgInfected: 241
    	},
    	{
    		state: "NC",
    		county: "Hertford County",
    		avgInfected: 77.75
    	},
    	{
    		state: "NC",
    		county: "Hoke County",
    		avgInfected: 152.41666666666666
    	},
    	{
    		state: "NC",
    		county: "Hyde County",
    		avgInfected: 15.083333333333334
    	},
    	{
    		state: "NC",
    		county: "Iredell County",
    		avgInfected: 399.3333333333333
    	},
    	{
    		state: "NC",
    		county: "Jackson County",
    		avgInfected: 108.5
    	},
    	{
    		state: "NC",
    		county: "Johnston County",
    		avgInfected: 575.5833333333334
    	},
    	{
    		state: "NC",
    		county: "Jones County",
    		avgInfected: 19.166666666666668
    	},
    	{
    		state: "NC",
    		county: "Lee County",
    		avgInfected: 194.5
    	},
    	{
    		state: "NC",
    		county: "Lenoir County",
    		avgInfected: 156.33333333333334
    	},
    	{
    		state: "NC",
    		county: "Lincoln County",
    		avgInfected: 253.25
    	},
    	{
    		state: "NC",
    		county: "Macon County",
    		avgInfected: 103.91666666666667
    	},
    	{
    		state: "NC",
    		county: "Madison County",
    		avgInfected: 60.333333333333336
    	},
    	{
    		state: "NC",
    		county: "Martin County",
    		avgInfected: 63.583333333333336
    	},
    	{
    		state: "NC",
    		county: "McDowell County",
    		avgInfected: 137
    	},
    	{
    		state: "NC",
    		county: "Mecklenburg County",
    		avgInfected: 3290.8333333333335
    	},
    	{
    		state: "NC",
    		county: "Mitchell County",
    		avgInfected: 37
    	},
    	{
    		state: "NC",
    		county: "Montgomery County",
    		avgInfected: 109.41666666666667
    	},
    	{
    		state: "NC",
    		county: "Moore County",
    		avgInfected: 221.16666666666666
    	},
    	{
    		state: "NC",
    		county: "Nash County",
    		avgInfected: 341.9166666666667
    	},
    	{
    		state: "NC",
    		county: "New Hanover County",
    		avgInfected: 528.3333333333334
    	},
    	{
    		state: "NC",
    		county: "Northampton County",
    		avgInfected: 58.166666666666664
    	},
    	{
    		state: "NC",
    		county: "Onslow County",
    		avgInfected: 372.5
    	},
    	{
    		state: "NC",
    		county: "Orange County",
    		avgInfected: 302.25
    	},
    	{
    		state: "NC",
    		county: "Pamlico County",
    		avgInfected: 29.916666666666668
    	},
    	{
    		state: "NC",
    		county: "Pasquotank County",
    		avgInfected: 84.25
    	},
    	{
    		state: "NC",
    		county: "Pender County",
    		avgInfected: 140
    	},
    	{
    		state: "NC",
    		county: "Perquimans County",
    		avgInfected: 25.583333333333332
    	},
    	{
    		state: "NC",
    		county: "Person County",
    		avgInfected: 71.58333333333333
    	},
    	{
    		state: "NC",
    		county: "Pitt County",
    		avgInfected: 597.1666666666666
    	},
    	{
    		state: "NC",
    		county: "Polk County",
    		avgInfected: 36.75
    	},
    	{
    		state: "NC",
    		county: "Randolph County",
    		avgInfected: 402.3333333333333
    	},
    	{
    		state: "NC",
    		county: "Richmond County",
    		avgInfected: 142.16666666666666
    	},
    	{
    		state: "NC",
    		county: "Robeson County",
    		avgInfected: 571.9166666666666
    	},
    	{
    		state: "NC",
    		county: "Rockingham County",
    		avgInfected: 224.5
    	},
    	{
    		state: "NC",
    		county: "Rowan County",
    		avgInfected: 422
    	},
    	{
    		state: "NC",
    		county: "Rutherford County",
    		avgInfected: 176
    	},
    	{
    		state: "NC",
    		county: "Sampson County",
    		avgInfected: 277
    	},
    	{
    		state: "NC",
    		county: "Scotland County",
    		avgInfected: 151.58333333333334
    	},
    	{
    		state: "NC",
    		county: "Stanly County",
    		avgInfected: 228.66666666666666
    	},
    	{
    		state: "NC",
    		county: "Stokes County",
    		avgInfected: 81.16666666666667
    	},
    	{
    		state: "NC",
    		county: "Surry County",
    		avgInfected: 206
    	},
    	{
    		state: "NC",
    		county: "Swain County",
    		avgInfected: 29.666666666666668
    	},
    	{
    		state: "NC",
    		county: "Transylvania County",
    		avgInfected: 41.25
    	},
    	{
    		state: "NC",
    		county: "Tyrrell County",
    		avgInfected: 11.333333333333334
    	},
    	{
    		state: "NC",
    		county: "Union County",
    		avgInfected: 588.5
    	},
    	{
    		state: "NC",
    		county: "Vance County",
    		avgInfected: 126.25
    	},
    	{
    		state: "NC",
    		county: "Wake County",
    		avgInfected: 2134
    	},
    	{
    		state: "NC",
    		county: "Warren County",
    		avgInfected: 46.833333333333336
    	},
    	{
    		state: "NC",
    		county: "Washington County",
    		avgInfected: 24.416666666666668
    	},
    	{
    		state: "NC",
    		county: "Watauga County",
    		avgInfected: 138.5
    	},
    	{
    		state: "NC",
    		county: "Wayne County",
    		avgInfected: 442.4166666666667
    	},
    	{
    		state: "NC",
    		county: "Wilkes County",
    		avgInfected: 198.25
    	},
    	{
    		state: "NC",
    		county: "Wilson County",
    		avgInfected: 306.4166666666667
    	},
    	{
    		state: "NC",
    		county: "Yadkin County",
    		avgInfected: 109.83333333333333
    	},
    	{
    		state: "NC",
    		county: "Yancey County",
    		avgInfected: 38.833333333333336
    	},
    	{
    		state: "ND",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "ND",
    		county: "Adams County",
    		avgInfected: 12.416666666666666
    	},
    	{
    		state: "ND",
    		county: "Barnes County",
    		avgInfected: 72.08333333333333
    	},
    	{
    		state: "ND",
    		county: "Benson County",
    		avgInfected: 58.25
    	},
    	{
    		state: "ND",
    		county: "Billings County",
    		avgInfected: 3.1666666666666665
    	},
    	{
    		state: "ND",
    		county: "Bottineau County",
    		avgInfected: 39.916666666666664
    	},
    	{
    		state: "ND",
    		county: "Bowman County",
    		avgInfected: 14.75
    	},
    	{
    		state: "ND",
    		county: "Burke County",
    		avgInfected: 13.416666666666666
    	},
    	{
    		state: "ND",
    		county: "Burleigh County",
    		avgInfected: 888.1666666666666
    	},
    	{
    		state: "ND",
    		county: "Cass County",
    		avgInfected: 1219.3333333333333
    	},
    	{
    		state: "ND",
    		county: "Cavalier County",
    		avgInfected: 24.916666666666668
    	},
    	{
    		state: "ND",
    		county: "Dickey County",
    		avgInfected: 42.416666666666664
    	},
    	{
    		state: "ND",
    		county: "Divide County",
    		avgInfected: 9.583333333333334
    	},
    	{
    		state: "ND",
    		county: "Dunn County",
    		avgInfected: 22.75
    	},
    	{
    		state: "ND",
    		county: "Eddy County",
    		avgInfected: 28.083333333333332
    	},
    	{
    		state: "ND",
    		county: "Emmons County",
    		avgInfected: 27.083333333333332
    	},
    	{
    		state: "ND",
    		county: "Foster County",
    		avgInfected: 34.166666666666664
    	},
    	{
    		state: "ND",
    		county: "Golden Valley County",
    		avgInfected: 12.166666666666666
    	},
    	{
    		state: "ND",
    		county: "Grand Forks County",
    		avgInfected: 622.25
    	},
    	{
    		state: "ND",
    		county: "Grant County",
    		avgInfected: 11.5
    	},
    	{
    		state: "ND",
    		county: "Griggs County",
    		avgInfected: 16.5
    	},
    	{
    		state: "ND",
    		county: "Hettinger County",
    		avgInfected: 17.333333333333332
    	},
    	{
    		state: "ND",
    		county: "Kidder County",
    		avgInfected: 13.666666666666666
    	},
    	{
    		state: "ND",
    		county: "LaMoure County",
    		avgInfected: 26.75
    	},
    	{
    		state: "ND",
    		county: "Logan County",
    		avgInfected: 12.583333333333334
    	},
    	{
    		state: "ND",
    		county: "McHenry County",
    		avgInfected: 34
    	},
    	{
    		state: "ND",
    		county: "McIntosh County",
    		avgInfected: 18.833333333333332
    	},
    	{
    		state: "ND",
    		county: "McKenzie County",
    		avgInfected: 67.08333333333333
    	},
    	{
    		state: "ND",
    		county: "McLean County",
    		avgInfected: 73.75
    	},
    	{
    		state: "ND",
    		county: "Mercer County",
    		avgInfected: 64.83333333333333
    	},
    	{
    		state: "ND",
    		county: "Morton County",
    		avgInfected: 302.0833333333333
    	},
    	{
    		state: "ND",
    		county: "Mountrail County",
    		avgInfected: 80
    	},
    	{
    		state: "ND",
    		county: "Nelson County",
    		avgInfected: 26.583333333333332
    	},
    	{
    		state: "ND",
    		county: "Oliver County",
    		avgInfected: 9.583333333333334
    	},
    	{
    		state: "ND",
    		county: "Pembina County",
    		avgInfected: 43.75
    	},
    	{
    		state: "ND",
    		county: "Pierce County",
    		avgInfected: 28.5
    	},
    	{
    		state: "ND",
    		county: "Ramsey County",
    		avgInfected: 83.5
    	},
    	{
    		state: "ND",
    		county: "Ransom County",
    		avgInfected: 31.916666666666668
    	},
    	{
    		state: "ND",
    		county: "Renville County",
    		avgInfected: 15.416666666666666
    	},
    	{
    		state: "ND",
    		county: "Richland County",
    		avgInfected: 80.83333333333333
    	},
    	{
    		state: "ND",
    		county: "Rolette County",
    		avgInfected: 102.25
    	},
    	{
    		state: "ND",
    		county: "Sargent County",
    		avgInfected: 20.666666666666668
    	},
    	{
    		state: "ND",
    		county: "Sheridan County",
    		avgInfected: 6.083333333333333
    	},
    	{
    		state: "ND",
    		county: "Sioux County",
    		avgInfected: 33.166666666666664
    	},
    	{
    		state: "ND",
    		county: "Slope County",
    		avgInfected: 1.5833333333333333
    	},
    	{
    		state: "ND",
    		county: "Stark County",
    		avgInfected: 269.5
    	},
    	{
    		state: "ND",
    		county: "Steele County",
    		avgInfected: 8.916666666666666
    	},
    	{
    		state: "ND",
    		county: "Stutsman County",
    		avgInfected: 191.16666666666666
    	},
    	{
    		state: "ND",
    		county: "Towner County",
    		avgInfected: 15.583333333333334
    	},
    	{
    		state: "ND",
    		county: "Traill County",
    		avgInfected: 51.833333333333336
    	},
    	{
    		state: "ND",
    		county: "Walsh County",
    		avgInfected: 109.16666666666667
    	},
    	{
    		state: "ND",
    		county: "Ward County",
    		avgInfected: 566.8333333333334
    	},
    	{
    		state: "ND",
    		county: "Wells County",
    		avgInfected: 23.583333333333332
    	},
    	{
    		state: "ND",
    		county: "Williams County",
    		avgInfected: 229.91666666666666
    	},
    	{
    		state: "OH",
    		county: "Statewide Unallocated",
    		avgInfected: 0.08333333333333333
    	},
    	{
    		state: "OH",
    		county: "Adams County",
    		avgInfected: 44.75
    	},
    	{
    		state: "OH",
    		county: "Allen County",
    		avgInfected: 327.5833333333333
    	},
    	{
    		state: "OH",
    		county: "Ashland County",
    		avgInfected: 67.41666666666667
    	},
    	{
    		state: "OH",
    		county: "Ashtabula County",
    		avgInfected: 133.33333333333334
    	},
    	{
    		state: "OH",
    		county: "Athens County",
    		avgInfected: 137.33333333333334
    	},
    	{
    		state: "OH",
    		county: "Auglaize County",
    		avgInfected: 157.66666666666666
    	},
    	{
    		state: "OH",
    		county: "Belmont County",
    		avgInfected: 107.58333333333333
    	},
    	{
    		state: "OH",
    		county: "Brown County",
    		avgInfected: 62.25
    	},
    	{
    		state: "OH",
    		county: "Butler County",
    		avgInfected: 1050.8333333333333
    	},
    	{
    		state: "OH",
    		county: "Carroll County",
    		avgInfected: 29.583333333333332
    	},
    	{
    		state: "OH",
    		county: "Champaign County",
    		avgInfected: 62.75
    	},
    	{
    		state: "OH",
    		county: "Clark County",
    		avgInfected: 352.5
    	},
    	{
    		state: "OH",
    		county: "Clermont County",
    		avgInfected: 377.1666666666667
    	},
    	{
    		state: "OH",
    		county: "Clinton County",
    		avgInfected: 72.33333333333333
    	},
    	{
    		state: "OH",
    		county: "Columbiana County",
    		avgInfected: 238.25
    	},
    	{
    		state: "OH",
    		county: "Coshocton County",
    		avgInfected: 55.75
    	},
    	{
    		state: "OH",
    		county: "Crawford County",
    		avgInfected: 79
    	},
    	{
    		state: "OH",
    		county: "Cuyahoga County",
    		avgInfected: 2496
    	},
    	{
    		state: "OH",
    		county: "Darke County",
    		avgInfected: 145.83333333333334
    	},
    	{
    		state: "OH",
    		county: "Defiance County",
    		avgInfected: 88.41666666666667
    	},
    	{
    		state: "OH",
    		county: "Delaware County",
    		avgInfected: 367.3333333333333
    	},
    	{
    		state: "OH",
    		county: "Erie County",
    		avgInfected: 146.58333333333334
    	},
    	{
    		state: "OH",
    		county: "Fairfield County",
    		avgInfected: 364.1666666666667
    	},
    	{
    		state: "OH",
    		county: "Fayette County",
    		avgInfected: 62.833333333333336
    	},
    	{
    		state: "OH",
    		county: "Franklin County",
    		avgInfected: 3626.6666666666665
    	},
    	{
    		state: "OH",
    		county: "Fulton County",
    		avgInfected: 84.33333333333333
    	},
    	{
    		state: "OH",
    		county: "Gallia County",
    		avgInfected: 44.083333333333336
    	},
    	{
    		state: "OH",
    		county: "Geauga County",
    		avgInfected: 130.33333333333334
    	},
    	{
    		state: "OH",
    		county: "Greene County",
    		avgInfected: 356.75
    	},
    	{
    		state: "OH",
    		county: "Guernsey County",
    		avgInfected: 56.083333333333336
    	},
    	{
    		state: "OH",
    		county: "Hamilton County",
    		avgInfected: 2127.3333333333335
    	},
    	{
    		state: "OH",
    		county: "Hancock County",
    		avgInfected: 157.66666666666666
    	},
    	{
    		state: "OH",
    		county: "Hardin County",
    		avgInfected: 56.583333333333336
    	},
    	{
    		state: "OH",
    		county: "Harrison County",
    		avgInfected: 12.083333333333334
    	},
    	{
    		state: "OH",
    		county: "Henry County",
    		avgInfected: 69.16666666666667
    	},
    	{
    		state: "OH",
    		county: "Highland County",
    		avgInfected: 67.91666666666667
    	},
    	{
    		state: "OH",
    		county: "Hocking County",
    		avgInfected: 40.666666666666664
    	},
    	{
    		state: "OH",
    		county: "Holmes County",
    		avgInfected: 105
    	},
    	{
    		state: "OH",
    		county: "Huron County",
    		avgInfected: 95.58333333333333
    	},
    	{
    		state: "OH",
    		county: "Jackson County",
    		avgInfected: 63.083333333333336
    	},
    	{
    		state: "OH",
    		county: "Jefferson County",
    		avgInfected: 69
    	},
    	{
    		state: "OH",
    		county: "Knox County",
    		avgInfected: 75.16666666666667
    	},
    	{
    		state: "OH",
    		county: "Lake County",
    		avgInfected: 416.75
    	},
    	{
    		state: "OH",
    		county: "Lawrence County",
    		avgInfected: 130.75
    	},
    	{
    		state: "OH",
    		county: "Licking County",
    		avgInfected: 361.8333333333333
    	},
    	{
    		state: "OH",
    		county: "Logan County",
    		avgInfected: 78.83333333333333
    	},
    	{
    		state: "OH",
    		county: "Lorain County",
    		avgInfected: 408.25
    	},
    	{
    		state: "OH",
    		county: "Lucas County",
    		avgInfected: 1008.0833333333334
    	},
    	{
    		state: "OH",
    		county: "Madison County",
    		avgInfected: 110.66666666666667
    	},
    	{
    		state: "OH",
    		county: "Mahoning County",
    		avgInfected: 470.3333333333333
    	},
    	{
    		state: "OH",
    		county: "Marion County",
    		avgInfected: 345.9166666666667
    	},
    	{
    		state: "OH",
    		county: "Medina County",
    		avgInfected: 292.0833333333333
    	},
    	{
    		state: "OH",
    		county: "Meigs County",
    		avgInfected: 25.666666666666668
    	},
    	{
    		state: "OH",
    		county: "Mercer County",
    		avgInfected: 208.16666666666666
    	},
    	{
    		state: "OH",
    		county: "Miami County",
    		avgInfected: 287.75
    	},
    	{
    		state: "OH",
    		county: "Monroe County",
    		avgInfected: 21.666666666666668
    	},
    	{
    		state: "OH",
    		county: "Montgomery County",
    		avgInfected: 1408.6666666666667
    	},
    	{
    		state: "OH",
    		county: "Morgan County",
    		avgInfected: 13.666666666666666
    	},
    	{
    		state: "OH",
    		county: "Morrow County",
    		avgInfected: 56.583333333333336
    	},
    	{
    		state: "OH",
    		county: "Muskingum County",
    		avgInfected: 148.16666666666666
    	},
    	{
    		state: "OH",
    		county: "Noble County",
    		avgInfected: 40.166666666666664
    	},
    	{
    		state: "OH",
    		county: "Ottawa County",
    		avgInfected: 79.5
    	},
    	{
    		state: "OH",
    		county: "Paulding County",
    		avgInfected: 40.25
    	},
    	{
    		state: "OH",
    		county: "Perry County",
    		avgInfected: 50.166666666666664
    	},
    	{
    		state: "OH",
    		county: "Pickaway County",
    		avgInfected: 308.3333333333333
    	},
    	{
    		state: "OH",
    		county: "Pike County",
    		avgInfected: 49.166666666666664
    	},
    	{
    		state: "OH",
    		county: "Portage County",
    		avgInfected: 231.33333333333334
    	},
    	{
    		state: "OH",
    		county: "Preble County",
    		avgInfected: 100.83333333333333
    	},
    	{
    		state: "OH",
    		county: "Putnam County",
    		avgInfected: 165.41666666666666
    	},
    	{
    		state: "OH",
    		county: "Richland County",
    		avgInfected: 202.66666666666666
    	},
    	{
    		state: "OH",
    		county: "Ross County",
    		avgInfected: 174
    	},
    	{
    		state: "OH",
    		county: "Sandusky County",
    		avgInfected: 103.91666666666667
    	},
    	{
    		state: "OH",
    		county: "Scioto County",
    		avgInfected: 130.58333333333334
    	},
    	{
    		state: "OH",
    		county: "Seneca County",
    		avgInfected: 110
    	},
    	{
    		state: "OH",
    		county: "Shelby County",
    		avgInfected: 127.66666666666667
    	},
    	{
    		state: "OH",
    		county: "Stark County",
    		avgInfected: 563
    	},
    	{
    		state: "OH",
    		county: "Summit County",
    		avgInfected: 900.1666666666666
    	},
    	{
    		state: "OH",
    		county: "Trumbull County",
    		avgInfected: 330.8333333333333
    	},
    	{
    		state: "OH",
    		county: "Tuscarawas County",
    		avgInfected: 197.16666666666666
    	},
    	{
    		state: "OH",
    		county: "Union County",
    		avgInfected: 126.33333333333333
    	},
    	{
    		state: "OH",
    		county: "Van Wert County",
    		avgInfected: 56.333333333333336
    	},
    	{
    		state: "OH",
    		county: "Vinton County",
    		avgInfected: 15
    	},
    	{
    		state: "OH",
    		county: "Warren County",
    		avgInfected: 562.5833333333334
    	},
    	{
    		state: "OH",
    		county: "Washington County",
    		avgInfected: 71.66666666666667
    	},
    	{
    		state: "OH",
    		county: "Wayne County",
    		avgInfected: 226.41666666666666
    	},
    	{
    		state: "OH",
    		county: "Williams County",
    		avgInfected: 69.58333333333333
    	},
    	{
    		state: "OH",
    		county: "Wood County",
    		avgInfected: 310.4166666666667
    	},
    	{
    		state: "OH",
    		county: "Wyandot County",
    		avgInfected: 44.916666666666664
    	},
    	{
    		state: "OK",
    		county: "Statewide Unallocated",
    		avgInfected: 10.583333333333334
    	},
    	{
    		state: "OK",
    		county: "Adair County",
    		avgInfected: 91.08333333333333
    	},
    	{
    		state: "OK",
    		county: "Alfalfa County",
    		avgInfected: 22.083333333333332
    	},
    	{
    		state: "OK",
    		county: "Atoka County",
    		avgInfected: 60.5
    	},
    	{
    		state: "OK",
    		county: "Beaver County",
    		avgInfected: 12.333333333333334
    	},
    	{
    		state: "OK",
    		county: "Beckham County",
    		avgInfected: 94.66666666666667
    	},
    	{
    		state: "OK",
    		county: "Blaine County",
    		avgInfected: 25.166666666666668
    	},
    	{
    		state: "OK",
    		county: "Bryan County",
    		avgInfected: 205.66666666666666
    	},
    	{
    		state: "OK",
    		county: "Caddo County",
    		avgInfected: 128.58333333333334
    	},
    	{
    		state: "OK",
    		county: "Canadian County",
    		avgInfected: 486.1666666666667
    	},
    	{
    		state: "OK",
    		county: "Carter County",
    		avgInfected: 110.58333333333333
    	},
    	{
    		state: "OK",
    		county: "Cherokee County",
    		avgInfected: 159.08333333333334
    	},
    	{
    		state: "OK",
    		county: "Choctaw County",
    		avgInfected: 52.166666666666664
    	},
    	{
    		state: "OK",
    		county: "Cimarron County",
    		avgInfected: 5
    	},
    	{
    		state: "OK",
    		county: "Cleveland County",
    		avgInfected: 916
    	},
    	{
    		state: "OK",
    		county: "Coal County",
    		avgInfected: 19.166666666666668
    	},
    	{
    		state: "OK",
    		county: "Comanche County",
    		avgInfected: 318.25
    	},
    	{
    		state: "OK",
    		county: "Cotton County",
    		avgInfected: 13.5
    	},
    	{
    		state: "OK",
    		county: "Craig County",
    		avgInfected: 68
    	},
    	{
    		state: "OK",
    		county: "Creek County",
    		avgInfected: 184
    	},
    	{
    		state: "OK",
    		county: "Custer County",
    		avgInfected: 127.33333333333333
    	},
    	{
    		state: "OK",
    		county: "Delaware County",
    		avgInfected: 139.66666666666666
    	},
    	{
    		state: "OK",
    		county: "Dewey County",
    		avgInfected: 12.666666666666666
    	},
    	{
    		state: "OK",
    		county: "Ellis County",
    		avgInfected: 8.833333333333334
    	},
    	{
    		state: "OK",
    		county: "Garfield County",
    		avgInfected: 266.5
    	},
    	{
    		state: "OK",
    		county: "Garvin County",
    		avgInfected: 110.41666666666667
    	},
    	{
    		state: "OK",
    		county: "Grady County",
    		avgInfected: 187
    	},
    	{
    		state: "OK",
    		county: "Grant County",
    		avgInfected: 15
    	},
    	{
    		state: "OK",
    		county: "Greer County",
    		avgInfected: 17.75
    	},
    	{
    		state: "OK",
    		county: "Harmon County",
    		avgInfected: 7.833333333333333
    	},
    	{
    		state: "OK",
    		county: "Harper County",
    		avgInfected: 10.666666666666666
    	},
    	{
    		state: "OK",
    		county: "Haskell County",
    		avgInfected: 48.75
    	},
    	{
    		state: "OK",
    		county: "Hughes County",
    		avgInfected: 44.083333333333336
    	},
    	{
    		state: "OK",
    		county: "Jackson County",
    		avgInfected: 133.58333333333334
    	},
    	{
    		state: "OK",
    		county: "Jefferson County",
    		avgInfected: 11.666666666666666
    	},
    	{
    		state: "OK",
    		county: "Johnston County",
    		avgInfected: 37.25
    	},
    	{
    		state: "OK",
    		county: "Kay County",
    		avgInfected: 119.5
    	},
    	{
    		state: "OK",
    		county: "Kingfisher County",
    		avgInfected: 63.333333333333336
    	},
    	{
    		state: "OK",
    		county: "Kiowa County",
    		avgInfected: 23.416666666666668
    	},
    	{
    		state: "OK",
    		county: "Latimer County",
    		avgInfected: 23.333333333333332
    	},
    	{
    		state: "OK",
    		county: "Le Flore County",
    		avgInfected: 180.66666666666666
    	},
    	{
    		state: "OK",
    		county: "Lincoln County",
    		avgInfected: 94.33333333333333
    	},
    	{
    		state: "OK",
    		county: "Logan County",
    		avgInfected: 97.83333333333333
    	},
    	{
    		state: "OK",
    		county: "Love County",
    		avgInfected: 39
    	},
    	{
    		state: "OK",
    		county: "McClain County",
    		avgInfected: 171.58333333333334
    	},
    	{
    		state: "OK",
    		county: "McCurtain County",
    		avgInfected: 173.66666666666666
    	},
    	{
    		state: "OK",
    		county: "McIntosh County",
    		avgInfected: 59.083333333333336
    	},
    	{
    		state: "OK",
    		county: "Major County",
    		avgInfected: 30.083333333333332
    	},
    	{
    		state: "OK",
    		county: "Marshall County",
    		avgInfected: 47.5
    	},
    	{
    		state: "OK",
    		county: "Mayes County",
    		avgInfected: 110.66666666666667
    	},
    	{
    		state: "OK",
    		county: "Murray County",
    		avgInfected: 42.333333333333336
    	},
    	{
    		state: "OK",
    		county: "Muskogee County",
    		avgInfected: 304.1666666666667
    	},
    	{
    		state: "OK",
    		county: "Noble County",
    		avgInfected: 28.75
    	},
    	{
    		state: "OK",
    		county: "Nowata County",
    		avgInfected: 29.75
    	},
    	{
    		state: "OK",
    		county: "Okfuskee County",
    		avgInfected: 72.41666666666667
    	},
    	{
    		state: "OK",
    		county: "Oklahoma County",
    		avgInfected: 2775.75
    	},
    	{
    		state: "OK",
    		county: "Okmulgee County",
    		avgInfected: 134
    	},
    	{
    		state: "OK",
    		county: "Osage County",
    		avgInfected: 145.75
    	},
    	{
    		state: "OK",
    		county: "Ottawa County",
    		avgInfected: 129.08333333333334
    	},
    	{
    		state: "OK",
    		county: "Pawnee County",
    		avgInfected: 40
    	},
    	{
    		state: "OK",
    		county: "Payne County",
    		avgInfected: 308.0833333333333
    	},
    	{
    		state: "OK",
    		county: "Pittsburg County",
    		avgInfected: 140.5
    	},
    	{
    		state: "OK",
    		county: "Pontotoc County",
    		avgInfected: 128.75
    	},
    	{
    		state: "OK",
    		county: "Pottawatomie County",
    		avgInfected: 244.33333333333334
    	},
    	{
    		state: "OK",
    		county: "Pushmataha County",
    		avgInfected: 31.666666666666668
    	},
    	{
    		state: "OK",
    		county: "Roger Mills County",
    		avgInfected: 10.25
    	},
    	{
    		state: "OK",
    		county: "Rogers County",
    		avgInfected: 288.1666666666667
    	},
    	{
    		state: "OK",
    		county: "Seminole County",
    		avgInfected: 92.5
    	},
    	{
    		state: "OK",
    		county: "Sequoyah County",
    		avgInfected: 136.25
    	},
    	{
    		state: "OK",
    		county: "Stephens County",
    		avgInfected: 106.41666666666667
    	},
    	{
    		state: "OK",
    		county: "Texas County",
    		avgInfected: 179.66666666666666
    	},
    	{
    		state: "OK",
    		county: "Tillman County",
    		avgInfected: 21.5
    	},
    	{
    		state: "OK",
    		county: "Tulsa County",
    		avgInfected: 2375.5
    	},
    	{
    		state: "OK",
    		county: "Wagoner County",
    		avgInfected: 199.08333333333334
    	},
    	{
    		state: "OK",
    		county: "Washington County",
    		avgInfected: 143.08333333333334
    	},
    	{
    		state: "OK",
    		county: "Washita County",
    		avgInfected: 24.25
    	},
    	{
    		state: "OK",
    		county: "Woods County",
    		avgInfected: 33.5
    	},
    	{
    		state: "OK",
    		county: "Woodward County",
    		avgInfected: 134.91666666666666
    	},
    	{
    		state: "OR",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "OR",
    		county: "Baker County",
    		avgInfected: 20
    	},
    	{
    		state: "OR",
    		county: "Benton County",
    		avgInfected: 55.333333333333336
    	},
    	{
    		state: "OR",
    		county: "Clackamas County",
    		avgInfected: 412.0833333333333
    	},
    	{
    		state: "OR",
    		county: "Clatsop County",
    		avgInfected: 26.083333333333332
    	},
    	{
    		state: "OR",
    		county: "Columbia County",
    		avgInfected: 32.083333333333336
    	},
    	{
    		state: "OR",
    		county: "Coos County",
    		avgInfected: 30
    	},
    	{
    		state: "OR",
    		county: "Crook County",
    		avgInfected: 15
    	},
    	{
    		state: "OR",
    		county: "Curry County",
    		avgInfected: 8
    	},
    	{
    		state: "OR",
    		county: "Deschutes County",
    		avgInfected: 148.41666666666666
    	},
    	{
    		state: "OR",
    		county: "Douglas County",
    		avgInfected: 59.833333333333336
    	},
    	{
    		state: "OR",
    		county: "Gilliam County",
    		avgInfected: 1.75
    	},
    	{
    		state: "OR",
    		county: "Grant County",
    		avgInfected: 6.166666666666667
    	},
    	{
    		state: "OR",
    		county: "Harney County",
    		avgInfected: 6.5
    	},
    	{
    		state: "OR",
    		county: "Hood River County",
    		avgInfected: 28.833333333333332
    	},
    	{
    		state: "OR",
    		county: "Jackson County",
    		avgInfected: 263
    	},
    	{
    		state: "OR",
    		county: "Jefferson County",
    		avgInfected: 61.5
    	},
    	{
    		state: "OR",
    		county: "Josephine County",
    		avgInfected: 31.916666666666668
    	},
    	{
    		state: "OR",
    		county: "Klamath County",
    		avgInfected: 47.75
    	},
    	{
    		state: "OR",
    		county: "Lake County",
    		avgInfected: 6.833333333333333
    	},
    	{
    		state: "OR",
    		county: "Lane County",
    		avgInfected: 298.5
    	},
    	{
    		state: "OR",
    		county: "Lincoln County",
    		avgInfected: 46
    	},
    	{
    		state: "OR",
    		county: "Linn County",
    		avgInfected: 96.83333333333333
    	},
    	{
    		state: "OR",
    		county: "Malheur County",
    		avgInfected: 186.83333333333334
    	},
    	{
    		state: "OR",
    		county: "Marion County",
    		avgInfected: 659.5
    	},
    	{
    		state: "OR",
    		county: "Morrow County",
    		avgInfected: 49.833333333333336
    	},
    	{
    		state: "OR",
    		county: "Multnomah County",
    		avgInfected: 1143.75
    	},
    	{
    		state: "OR",
    		county: "Polk County",
    		avgInfected: 80.08333333333333
    	},
    	{
    		state: "OR",
    		county: "Sherman County",
    		avgInfected: 1.9166666666666667
    	},
    	{
    		state: "OR",
    		county: "Tillamook County",
    		avgInfected: 9.083333333333334
    	},
    	{
    		state: "OR",
    		county: "Umatilla County",
    		avgInfected: 330.75
    	},
    	{
    		state: "OR",
    		county: "Union County",
    		avgInfected: 53.166666666666664
    	},
    	{
    		state: "OR",
    		county: "Wallowa County",
    		avgInfected: 5.833333333333333
    	},
    	{
    		state: "OR",
    		county: "Wasco County",
    		avgInfected: 36.166666666666664
    	},
    	{
    		state: "OR",
    		county: "Washington County",
    		avgInfected: 692.75
    	},
    	{
    		state: "OR",
    		county: "Wheeler County",
    		avgInfected: 0.08333333333333333
    	},
    	{
    		state: "OR",
    		county: "Yamhill County",
    		avgInfected: 120.58333333333333
    	},
    	{
    		state: "PA",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "PA",
    		county: "Adams County",
    		avgInfected: 134.25
    	},
    	{
    		state: "PA",
    		county: "Allegheny County",
    		avgInfected: 1836.9166666666667
    	},
    	{
    		state: "PA",
    		county: "Armstrong County",
    		avgInfected: 116.25
    	},
    	{
    		state: "PA",
    		county: "Beaver County",
    		avgInfected: 258.5
    	},
    	{
    		state: "PA",
    		county: "Bedford County",
    		avgInfected: 89.08333333333333
    	},
    	{
    		state: "PA",
    		county: "Berks County",
    		avgInfected: 1006.8333333333334
    	},
    	{
    		state: "PA",
    		county: "Blair County",
    		avgInfected: 239.33333333333334
    	},
    	{
    		state: "PA",
    		county: "Bradford County",
    		avgInfected: 129.16666666666666
    	},
    	{
    		state: "PA",
    		county: "Bucks County",
    		avgInfected: 1173
    	},
    	{
    		state: "PA",
    		county: "Butler County",
    		avgInfected: 276.0833333333333
    	},
    	{
    		state: "PA",
    		county: "Cambria County",
    		avgInfected: 221.91666666666666
    	},
    	{
    		state: "PA",
    		county: "Cameron County",
    		avgInfected: 1.4166666666666667
    	},
    	{
    		state: "PA",
    		county: "Carbon County",
    		avgInfected: 81.58333333333333
    	},
    	{
    		state: "PA",
    		county: "Centre County",
    		avgInfected: 450.9166666666667
    	},
    	{
    		state: "PA",
    		county: "Chester County",
    		avgInfected: 866.8333333333334
    	},
    	{
    		state: "PA",
    		county: "Clarion County",
    		avgInfected: 49.916666666666664
    	},
    	{
    		state: "PA",
    		county: "Clearfield County",
    		avgInfected: 84.58333333333333
    	},
    	{
    		state: "PA",
    		county: "Clinton County",
    		avgInfected: 39
    	},
    	{
    		state: "PA",
    		county: "Columbia County",
    		avgInfected: 107
    	},
    	{
    		state: "PA",
    		county: "Crawford County",
    		avgInfected: 109.16666666666667
    	},
    	{
    		state: "PA",
    		county: "Cumberland County",
    		avgInfected: 327.75
    	},
    	{
    		state: "PA",
    		county: "Dauphin County",
    		avgInfected: 542.8333333333334
    	},
    	{
    		state: "PA",
    		county: "Delaware County",
    		avgInfected: 1468.75
    	},
    	{
    		state: "PA",
    		county: "Elk County",
    		avgInfected: 32.75
    	},
    	{
    		state: "PA",
    		county: "Erie County",
    		avgInfected: 324.9166666666667
    	},
    	{
    		state: "PA",
    		county: "Fayette County",
    		avgInfected: 128.91666666666666
    	},
    	{
    		state: "PA",
    		county: "Forest County",
    		avgInfected: 2.5833333333333335
    	},
    	{
    		state: "PA",
    		county: "Franklin County",
    		avgInfected: 292.3333333333333
    	},
    	{
    		state: "PA",
    		county: "Fulton County",
    		avgInfected: 15.916666666666666
    	},
    	{
    		state: "PA",
    		county: "Greene County",
    		avgInfected: 44.083333333333336
    	},
    	{
    		state: "PA",
    		county: "Huntingdon County",
    		avgInfected: 121.75
    	},
    	{
    		state: "PA",
    		county: "Indiana County",
    		avgInfected: 166.5
    	},
    	{
    		state: "PA",
    		county: "Jefferson County",
    		avgInfected: 41
    	},
    	{
    		state: "PA",
    		county: "Juniata County",
    		avgInfected: 43.166666666666664
    	},
    	{
    		state: "PA",
    		county: "Lackawanna County",
    		avgInfected: 378.25
    	},
    	{
    		state: "PA",
    		county: "Lancaster County",
    		avgInfected: 1101.75
    	},
    	{
    		state: "PA",
    		county: "Lawrence County",
    		avgInfected: 143.75
    	},
    	{
    		state: "PA",
    		county: "Lebanon County",
    		avgInfected: 363.4166666666667
    	},
    	{
    		state: "PA",
    		county: "Lehigh County",
    		avgInfected: 765.25
    	},
    	{
    		state: "PA",
    		county: "Luzerne County",
    		avgInfected: 644.6666666666666
    	},
    	{
    		state: "PA",
    		county: "Lycoming County",
    		avgInfected: 127.75
    	},
    	{
    		state: "PA",
    		county: "McKean County",
    		avgInfected: 27.25
    	},
    	{
    		state: "PA",
    		county: "Mercer County",
    		avgInfected: 178.5
    	},
    	{
    		state: "PA",
    		county: "Mifflin County",
    		avgInfected: 94.66666666666667
    	},
    	{
    		state: "PA",
    		county: "Monroe County",
    		avgInfected: 227.33333333333334
    	},
    	{
    		state: "PA",
    		county: "Montgomery County",
    		avgInfected: 1543
    	},
    	{
    		state: "PA",
    		county: "Montour County",
    		avgInfected: 32.833333333333336
    	},
    	{
    		state: "PA",
    		county: "Northampton County",
    		avgInfected: 609.25
    	},
    	{
    		state: "PA",
    		county: "Northumberland County",
    		avgInfected: 173.41666666666666
    	},
    	{
    		state: "PA",
    		county: "Perry County",
    		avgInfected: 44.166666666666664
    	},
    	{
    		state: "PA",
    		county: "Philadelphia County",
    		avgInfected: 4387.083333333333
    	},
    	{
    		state: "PA",
    		county: "Pike County",
    		avgInfected: 64
    	},
    	{
    		state: "PA",
    		county: "Potter County",
    		avgInfected: 10.25
    	},
    	{
    		state: "PA",
    		county: "Schuylkill County",
    		avgInfected: 264.5833333333333
    	},
    	{
    		state: "PA",
    		county: "Snyder County",
    		avgInfected: 66.33333333333333
    	},
    	{
    		state: "PA",
    		county: "Somerset County",
    		avgInfected: 91.83333333333333
    	},
    	{
    		state: "PA",
    		county: "Sullivan County",
    		avgInfected: 3.25
    	},
    	{
    		state: "PA",
    		county: "Susquehanna County",
    		avgInfected: 42.416666666666664
    	},
    	{
    		state: "PA",
    		county: "Tioga County",
    		avgInfected: 52.75
    	},
    	{
    		state: "PA",
    		county: "Union County",
    		avgInfected: 90.33333333333333
    	},
    	{
    		state: "PA",
    		county: "Venango County",
    		avgInfected: 54.25
    	},
    	{
    		state: "PA",
    		county: "Warren County",
    		avgInfected: 11
    	},
    	{
    		state: "PA",
    		county: "Washington County",
    		avgInfected: 291.0833333333333
    	},
    	{
    		state: "PA",
    		county: "Wayne County",
    		avgInfected: 30.833333333333332
    	},
    	{
    		state: "PA",
    		county: "Westmoreland County",
    		avgInfected: 575.6666666666666
    	},
    	{
    		state: "PA",
    		county: "Wyoming County",
    		avgInfected: 30.166666666666668
    	},
    	{
    		state: "PA",
    		county: "York County",
    		avgInfected: 735.4166666666666
    	},
    	{
    		state: "RI",
    		county: "Statewide Unallocated",
    		avgInfected: 185.33333333333334
    	},
    	{
    		state: "RI",
    		county: "Bristol County",
    		avgInfected: 87
    	},
    	{
    		state: "RI",
    		county: "Kent County",
    		avgInfected: 346
    	},
    	{
    		state: "RI",
    		county: "Newport County",
    		avgInfected: 87.16666666666667
    	},
    	{
    		state: "RI",
    		county: "Providence County",
    		avgInfected: 2626
    	},
    	{
    		state: "RI",
    		county: "Washington County",
    		avgInfected: 157.58333333333334
    	},
    	{
    		state: "SC",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "SC",
    		county: "Abbeville County",
    		avgInfected: 73.91666666666667
    	},
    	{
    		state: "SC",
    		county: "Aiken County",
    		avgInfected: 489.5833333333333
    	},
    	{
    		state: "SC",
    		county: "Allendale County",
    		avgInfected: 36.833333333333336
    	},
    	{
    		state: "SC",
    		county: "Anderson County",
    		avgInfected: 606.0833333333334
    	},
    	{
    		state: "SC",
    		county: "Bamberg County",
    		avgInfected: 59.666666666666664
    	},
    	{
    		state: "SC",
    		county: "Barnwell County",
    		avgInfected: 78
    	},
    	{
    		state: "SC",
    		county: "Beaufort County",
    		avgInfected: 561.5833333333334
    	},
    	{
    		state: "SC",
    		county: "Berkeley County",
    		avgInfected: 567.1666666666666
    	},
    	{
    		state: "SC",
    		county: "Calhoun County",
    		avgInfected: 45
    	},
    	{
    		state: "SC",
    		county: "Charleston County",
    		avgInfected: 1579.5
    	},
    	{
    		state: "SC",
    		county: "Cherokee County",
    		avgInfected: 158.83333333333334
    	},
    	{
    		state: "SC",
    		county: "Chester County",
    		avgInfected: 119.16666666666667
    	},
    	{
    		state: "SC",
    		county: "Chesterfield County",
    		avgInfected: 139.33333333333334
    	},
    	{
    		state: "SC",
    		county: "Clarendon County",
    		avgInfected: 108.66666666666667
    	},
    	{
    		state: "SC",
    		county: "Colleton County",
    		avgInfected: 119.25
    	},
    	{
    		state: "SC",
    		county: "Darlington County",
    		avgInfected: 238.75
    	},
    	{
    		state: "SC",
    		county: "Dillon County",
    		avgInfected: 122.08333333333333
    	},
    	{
    		state: "SC",
    		county: "Dorchester County",
    		avgInfected: 452.1666666666667
    	},
    	{
    		state: "SC",
    		county: "Edgefield County",
    		avgInfected: 91.25
    	},
    	{
    		state: "SC",
    		county: "Fairfield County",
    		avgInfected: 82.5
    	},
    	{
    		state: "SC",
    		county: "Florence County",
    		avgInfected: 525.9166666666666
    	},
    	{
    		state: "SC",
    		county: "Georgetown County",
    		avgInfected: 221.25
    	},
    	{
    		state: "SC",
    		county: "Greenville County",
    		avgInfected: 1799.1666666666667
    	},
    	{
    		state: "SC",
    		county: "Greenwood County",
    		avgInfected: 239.5
    	},
    	{
    		state: "SC",
    		county: "Hampton County",
    		avgInfected: 69.41666666666667
    	},
    	{
    		state: "SC",
    		county: "Horry County",
    		avgInfected: 1164.4166666666667
    	},
    	{
    		state: "SC",
    		county: "Jasper County",
    		avgInfected: 83.66666666666667
    	},
    	{
    		state: "SC",
    		county: "Kershaw County",
    		avgInfected: 233.08333333333334
    	},
    	{
    		state: "SC",
    		county: "Lancaster County",
    		avgInfected: 264.75
    	},
    	{
    		state: "SC",
    		county: "Laurens County",
    		avgInfected: 190.91666666666666
    	},
    	{
    		state: "SC",
    		county: "Lee County",
    		avgInfected: 70.83333333333333
    	},
    	{
    		state: "SC",
    		county: "Lexington County",
    		avgInfected: 887.5
    	},
    	{
    		state: "SC",
    		county: "McCormick County",
    		avgInfected: 26
    	},
    	{
    		state: "SC",
    		county: "Marion County",
    		avgInfected: 106.16666666666667
    	},
    	{
    		state: "SC",
    		county: "Marlboro County",
    		avgInfected: 108.25
    	},
    	{
    		state: "SC",
    		county: "Newberry County",
    		avgInfected: 167
    	},
    	{
    		state: "SC",
    		county: "Oconee County",
    		avgInfected: 243.75
    	},
    	{
    		state: "SC",
    		county: "Orangeburg County",
    		avgInfected: 301.0833333333333
    	},
    	{
    		state: "SC",
    		county: "Pickens County",
    		avgInfected: 464.75
    	},
    	{
    		state: "SC",
    		county: "Richland County",
    		avgInfected: 1609.5833333333333
    	},
    	{
    		state: "SC",
    		county: "Saluda County",
    		avgInfected: 64.33333333333333
    	},
    	{
    		state: "SC",
    		county: "Spartanburg County",
    		avgInfected: 929.8333333333334
    	},
    	{
    		state: "SC",
    		county: "Sumter County",
    		avgInfected: 331.5833333333333
    	},
    	{
    		state: "SC",
    		county: "Union County",
    		avgInfected: 80.33333333333333
    	},
    	{
    		state: "SC",
    		county: "Williamsburg County",
    		avgInfected: 131.83333333333334
    	},
    	{
    		state: "SC",
    		county: "York County",
    		avgInfected: 719.0833333333334
    	},
    	{
    		state: "SD",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "SD",
    		county: "Aurora County",
    		avgInfected: 26.416666666666668
    	},
    	{
    		state: "SD",
    		county: "Beadle County",
    		avgInfected: 172.16666666666666
    	},
    	{
    		state: "SD",
    		county: "Bennett County",
    		avgInfected: 24.083333333333332
    	},
    	{
    		state: "SD",
    		county: "Bon Homme County",
    		avgInfected: 105.25
    	},
    	{
    		state: "SD",
    		county: "Brookings County",
    		avgInfected: 180.58333333333334
    	},
    	{
    		state: "SD",
    		county: "Brown County",
    		avgInfected: 256.25
    	},
    	{
    		state: "SD",
    		county: "Brule County",
    		avgInfected: 40.916666666666664
    	},
    	{
    		state: "SD",
    		county: "Buffalo County",
    		avgInfected: 28.916666666666668
    	},
    	{
    		state: "SD",
    		county: "Butte County",
    		avgInfected: 53.166666666666664
    	},
    	{
    		state: "SD",
    		county: "Campbell County",
    		avgInfected: 8
    	},
    	{
    		state: "SD",
    		county: "Charles Mix County",
    		avgInfected: 57.5
    	},
    	{
    		state: "SD",
    		county: "Clark County",
    		avgInfected: 17.333333333333332
    	},
    	{
    		state: "SD",
    		county: "Clay County",
    		avgInfected: 97.25
    	},
    	{
    		state: "SD",
    		county: "Codington County",
    		avgInfected: 195.58333333333334
    	},
    	{
    		state: "SD",
    		county: "Corson County",
    		avgInfected: 27.583333333333332
    	},
    	{
    		state: "SD",
    		county: "Custer County",
    		avgInfected: 39
    	},
    	{
    		state: "SD",
    		county: "Davison County",
    		avgInfected: 173
    	},
    	{
    		state: "SD",
    		county: "Day County",
    		avgInfected: 24.166666666666668
    	},
    	{
    		state: "SD",
    		county: "Deuel County",
    		avgInfected: 22.25
    	},
    	{
    		state: "SD",
    		county: "Dewey County",
    		avgInfected: 59.5
    	},
    	{
    		state: "SD",
    		county: "Douglas County",
    		avgInfected: 22.25
    	},
    	{
    		state: "SD",
    		county: "Edmunds County",
    		avgInfected: 17.75
    	},
    	{
    		state: "SD",
    		county: "Fall River County",
    		avgInfected: 28
    	},
    	{
    		state: "SD",
    		county: "Faulk County",
    		avgInfected: 22.25
    	},
    	{
    		state: "SD",
    		county: "Grant County",
    		avgInfected: 42.083333333333336
    	},
    	{
    		state: "SD",
    		county: "Gregory County",
    		avgInfected: 32.25
    	},
    	{
    		state: "SD",
    		county: "Haakon County",
    		avgInfected: 10.916666666666666
    	},
    	{
    		state: "SD",
    		county: "Hamlin County",
    		avgInfected: 31.916666666666668
    	},
    	{
    		state: "SD",
    		county: "Hand County",
    		avgInfected: 21.333333333333332
    	},
    	{
    		state: "SD",
    		county: "Hanson County",
    		avgInfected: 16.75
    	},
    	{
    		state: "SD",
    		county: "Harding County",
    		avgInfected: 5.333333333333333
    	},
    	{
    		state: "SD",
    		county: "Hughes County",
    		avgInfected: 118.33333333333333
    	},
    	{
    		state: "SD",
    		county: "Hutchinson County",
    		avgInfected: 38.75
    	},
    	{
    		state: "SD",
    		county: "Hyde County",
    		avgInfected: 9
    	},
    	{
    		state: "SD",
    		county: "Jackson County",
    		avgInfected: 15.25
    	},
    	{
    		state: "SD",
    		county: "Jerauld County",
    		avgInfected: 18.916666666666668
    	},
    	{
    		state: "SD",
    		county: "Jones County",
    		avgInfected: 4.25
    	},
    	{
    		state: "SD",
    		county: "Kingsbury County",
    		avgInfected: 32.333333333333336
    	},
    	{
    		state: "SD",
    		county: "Lake County",
    		avgInfected: 62.083333333333336
    	},
    	{
    		state: "SD",
    		county: "Lawrence County",
    		avgInfected: 146.41666666666666
    	},
    	{
    		state: "SD",
    		county: "Lincoln County",
    		avgInfected: 397.9166666666667
    	},
    	{
    		state: "SD",
    		county: "Lyman County",
    		avgInfected: 33.083333333333336
    	},
    	{
    		state: "SD",
    		county: "McCook County",
    		avgInfected: 44.833333333333336
    	},
    	{
    		state: "SD",
    		county: "McPherson County",
    		avgInfected: 9.75
    	},
    	{
    		state: "SD",
    		county: "Marshall County",
    		avgInfected: 10.75
    	},
    	{
    		state: "SD",
    		county: "Meade County",
    		avgInfected: 126.33333333333333
    	},
    	{
    		state: "SD",
    		county: "Mellette County",
    		avgInfected: 12.166666666666666
    	},
    	{
    		state: "SD",
    		county: "Miner County",
    		avgInfected: 14.833333333333334
    	},
    	{
    		state: "SD",
    		county: "Minnehaha County",
    		avgInfected: 1501.0833333333333
    	},
    	{
    		state: "SD",
    		county: "Moody County",
    		avgInfected: 30.5
    	},
    	{
    		state: "SD",
    		county: "Oglala Lakota County",
    		avgInfected: 123.08333333333333
    	},
    	{
    		state: "SD",
    		county: "Pennington County",
    		avgInfected: 622.4166666666666
    	},
    	{
    		state: "SD",
    		county: "Perkins County",
    		avgInfected: 11.416666666666666
    	},
    	{
    		state: "SD",
    		county: "Potter County",
    		avgInfected: 18.583333333333332
    	},
    	{
    		state: "SD",
    		county: "Roberts County",
    		avgInfected: 50.333333333333336
    	},
    	{
    		state: "SD",
    		county: "Sanborn County",
    		avgInfected: 18.333333333333332
    	},
    	{
    		state: "SD",
    		county: "Spink County",
    		avgInfected: 40.583333333333336
    	},
    	{
    		state: "SD",
    		county: "Stanley County",
    		avgInfected: 16.25
    	},
    	{
    		state: "SD",
    		county: "Sully County",
    		avgInfected: 6.5
    	},
    	{
    		state: "SD",
    		county: "Todd County",
    		avgInfected: 64.66666666666667
    	},
    	{
    		state: "SD",
    		county: "Tripp County",
    		avgInfected: 35.416666666666664
    	},
    	{
    		state: "SD",
    		county: "Turner County",
    		avgInfected: 61.083333333333336
    	},
    	{
    		state: "SD",
    		county: "Union County",
    		avgInfected: 92.41666666666667
    	},
    	{
    		state: "SD",
    		county: "Walworth County",
    		avgInfected: 33.75
    	},
    	{
    		state: "SD",
    		county: "Yankton County",
    		avgInfected: 117.91666666666667
    	},
    	{
    		state: "SD",
    		county: "Ziebach County",
    		avgInfected: 12.75
    	},
    	{
    		state: "TN",
    		county: "Statewide Unallocated",
    		avgInfected: 862.9166666666666
    	},
    	{
    		state: "TN",
    		county: "Anderson County",
    		avgInfected: 211.25
    	},
    	{
    		state: "TN",
    		county: "Bedford County",
    		avgInfected: 198.41666666666666
    	},
    	{
    		state: "TN",
    		county: "Benton County",
    		avgInfected: 59.833333333333336
    	},
    	{
    		state: "TN",
    		county: "Bledsoe County",
    		avgInfected: 93.91666666666667
    	},
    	{
    		state: "TN",
    		county: "Blount County",
    		avgInfected: 400.3333333333333
    	},
    	{
    		state: "TN",
    		county: "Bradley County",
    		avgInfected: 385.1666666666667
    	},
    	{
    		state: "TN",
    		county: "Campbell County",
    		avgInfected: 115.25
    	},
    	{
    		state: "TN",
    		county: "Cannon County",
    		avgInfected: 54.416666666666664
    	},
    	{
    		state: "TN",
    		county: "Carroll County",
    		avgInfected: 128.33333333333334
    	},
    	{
    		state: "TN",
    		county: "Carter County",
    		avgInfected: 202.25
    	},
    	{
    		state: "TN",
    		county: "Cheatham County",
    		avgInfected: 118.41666666666667
    	},
    	{
    		state: "TN",
    		county: "Chester County",
    		avgInfected: 77.58333333333333
    	},
    	{
    		state: "TN",
    		county: "Claiborne County",
    		avgInfected: 58.166666666666664
    	},
    	{
    		state: "TN",
    		county: "Clay County",
    		avgInfected: 42.5
    	},
    	{
    		state: "TN",
    		county: "Cocke County",
    		avgInfected: 124
    	},
    	{
    		state: "TN",
    		county: "Coffee County",
    		avgInfected: 209.83333333333334
    	},
    	{
    		state: "TN",
    		county: "Crockett County",
    		avgInfected: 90.91666666666667
    	},
    	{
    		state: "TN",
    		county: "Cumberland County",
    		avgInfected: 189.25
    	},
    	{
    		state: "TN",
    		county: "Davidson County",
    		avgInfected: 3283.75
    	},
    	{
    		state: "TN",
    		county: "Decatur County",
    		avgInfected: 71.66666666666667
    	},
    	{
    		state: "TN",
    		county: "DeKalb County",
    		avgInfected: 85
    	},
    	{
    		state: "TN",
    		county: "Dickson County",
    		avgInfected: 210.66666666666666
    	},
    	{
    		state: "TN",
    		county: "Dyer County",
    		avgInfected: 247.66666666666666
    	},
    	{
    		state: "TN",
    		county: "Fayette County",
    		avgInfected: 172.58333333333334
    	},
    	{
    		state: "TN",
    		county: "Fentress County",
    		avgInfected: 92.83333333333333
    	},
    	{
    		state: "TN",
    		county: "Franklin County",
    		avgInfected: 151.75
    	},
    	{
    		state: "TN",
    		county: "Gibson County",
    		avgInfected: 239.25
    	},
    	{
    		state: "TN",
    		county: "Giles County",
    		avgInfected: 108.33333333333333
    	},
    	{
    		state: "TN",
    		county: "Grainger County",
    		avgInfected: 70.16666666666667
    	},
    	{
    		state: "TN",
    		county: "Greene County",
    		avgInfected: 224.41666666666666
    	},
    	{
    		state: "TN",
    		county: "Grundy County",
    		avgInfected: 59.5
    	},
    	{
    		state: "TN",
    		county: "Hamblen County",
    		avgInfected: 260.9166666666667
    	},
    	{
    		state: "TN",
    		county: "Hamilton County",
    		avgInfected: 1270.5
    	},
    	{
    		state: "TN",
    		county: "Hancock County",
    		avgInfected: 11.5
    	},
    	{
    		state: "TN",
    		county: "Hardeman County",
    		avgInfected: 180.66666666666666
    	},
    	{
    		state: "TN",
    		county: "Hardin County",
    		avgInfected: 139.41666666666666
    	},
    	{
    		state: "TN",
    		county: "Hawkins County",
    		avgInfected: 142.25
    	},
    	{
    		state: "TN",
    		county: "Haywood County",
    		avgInfected: 127.83333333333333
    	},
    	{
    		state: "TN",
    		county: "Henderson County",
    		avgInfected: 144
    	},
    	{
    		state: "TN",
    		county: "Henry County",
    		avgInfected: 111.58333333333333
    	},
    	{
    		state: "TN",
    		county: "Hickman County",
    		avgInfected: 88.33333333333333
    	},
    	{
    		state: "TN",
    		county: "Houston County",
    		avgInfected: 46.5
    	},
    	{
    		state: "TN",
    		county: "Humphreys County",
    		avgInfected: 51.75
    	},
    	{
    		state: "TN",
    		county: "Jackson County",
    		avgInfected: 53.25
    	},
    	{
    		state: "TN",
    		county: "Jefferson County",
    		avgInfected: 169.41666666666666
    	},
    	{
    		state: "TN",
    		county: "Johnson County",
    		avgInfected: 112.5
    	},
    	{
    		state: "TN",
    		county: "Knox County",
    		avgInfected: 1401.4166666666667
    	},
    	{
    		state: "TN",
    		county: "Lake County",
    		avgInfected: 93.91666666666667
    	},
    	{
    		state: "TN",
    		county: "Lauderdale County",
    		avgInfected: 161
    	},
    	{
    		state: "TN",
    		county: "Lawrence County",
    		avgInfected: 199.91666666666666
    	},
    	{
    		state: "TN",
    		county: "Lewis County",
    		avgInfected: 56.666666666666664
    	},
    	{
    		state: "TN",
    		county: "Lincoln County",
    		avgInfected: 111.41666666666667
    	},
    	{
    		state: "TN",
    		county: "Loudon County",
    		avgInfected: 172.75
    	},
    	{
    		state: "TN",
    		county: "McMinn County",
    		avgInfected: 187.41666666666666
    	},
    	{
    		state: "TN",
    		county: "McNairy County",
    		avgInfected: 112.83333333333333
    	},
    	{
    		state: "TN",
    		county: "Macon County",
    		avgInfected: 142.25
    	},
    	{
    		state: "TN",
    		county: "Madison County",
    		avgInfected: 410.1666666666667
    	},
    	{
    		state: "TN",
    		county: "Marion County",
    		avgInfected: 84.08333333333333
    	},
    	{
    		state: "TN",
    		county: "Marshall County",
    		avgInfected: 130.08333333333334
    	},
    	{
    		state: "TN",
    		county: "Maury County",
    		avgInfected: 435.5
    	},
    	{
    		state: "TN",
    		county: "Meigs County",
    		avgInfected: 36.416666666666664
    	},
    	{
    		state: "TN",
    		county: "Monroe County",
    		avgInfected: 157.41666666666666
    	},
    	{
    		state: "TN",
    		county: "Montgomery County",
    		avgInfected: 483.75
    	},
    	{
    		state: "TN",
    		county: "Moore County",
    		avgInfected: 29.333333333333332
    	},
    	{
    		state: "TN",
    		county: "Morgan County",
    		avgInfected: 50
    	},
    	{
    		state: "TN",
    		county: "Obion County",
    		avgInfected: 199.75
    	},
    	{
    		state: "TN",
    		county: "Overton County",
    		avgInfected: 120.66666666666667
    	},
    	{
    		state: "TN",
    		county: "Perry County",
    		avgInfected: 37.5
    	},
    	{
    		state: "TN",
    		county: "Pickett County",
    		avgInfected: 29.333333333333332
    	},
    	{
    		state: "TN",
    		county: "Polk County",
    		avgInfected: 51
    	},
    	{
    		state: "TN",
    		county: "Putnam County",
    		avgInfected: 458.1666666666667
    	},
    	{
    		state: "TN",
    		county: "Rhea County",
    		avgInfected: 123.75
    	},
    	{
    		state: "TN",
    		county: "Roane County",
    		avgInfected: 174.66666666666666
    	},
    	{
    		state: "TN",
    		county: "Robertson County",
    		avgInfected: 279.4166666666667
    	},
    	{
    		state: "TN",
    		county: "Rutherford County",
    		avgInfected: 1337.6666666666667
    	},
    	{
    		state: "TN",
    		county: "Scott County",
    		avgInfected: 70.25
    	},
    	{
    		state: "TN",
    		county: "Sequatchie County",
    		avgInfected: 39.916666666666664
    	},
    	{
    		state: "TN",
    		county: "Sevier County",
    		avgInfected: 362.1666666666667
    	},
    	{
    		state: "TN",
    		county: "Shelby County",
    		avgInfected: 3697.8333333333335
    	},
    	{
    		state: "TN",
    		county: "Smith County",
    		avgInfected: 109.5
    	},
    	{
    		state: "TN",
    		county: "Stewart County",
    		avgInfected: 43.916666666666664
    	},
    	{
    		state: "TN",
    		county: "Sullivan County",
    		avgInfected: 468.3333333333333
    	},
    	{
    		state: "TN",
    		county: "Sumner County",
    		avgInfected: 710.75
    	},
    	{
    		state: "TN",
    		county: "Tipton County",
    		avgInfected: 269.4166666666667
    	},
    	{
    		state: "TN",
    		county: "Trousdale County",
    		avgInfected: 157.08333333333334
    	},
    	{
    		state: "TN",
    		county: "Unicoi County",
    		avgInfected: 59.916666666666664
    	},
    	{
    		state: "TN",
    		county: "Union County",
    		avgInfected: 55.5
    	},
    	{
    		state: "TN",
    		county: "Van Buren County",
    		avgInfected: 25.75
    	},
    	{
    		state: "TN",
    		county: "Warren County",
    		avgInfected: 178.33333333333334
    	},
    	{
    		state: "TN",
    		county: "Washington County",
    		avgInfected: 439.75
    	},
    	{
    		state: "TN",
    		county: "Wayne County",
    		avgInfected: 145.75
    	},
    	{
    		state: "TN",
    		county: "Weakley County",
    		avgInfected: 167.66666666666666
    	},
    	{
    		state: "TN",
    		county: "White County",
    		avgInfected: 133.5
    	},
    	{
    		state: "TN",
    		county: "Williamson County",
    		avgInfected: 837.9166666666666
    	},
    	{
    		state: "TN",
    		county: "Wilson County",
    		avgInfected: 548.4166666666666
    	},
    	{
    		state: "TX",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "TX",
    		county: "Anderson County",
    		avgInfected: 258.4166666666667
    	},
    	{
    		state: "TX",
    		county: "Andrews County",
    		avgInfected: 78.33333333333333
    	},
    	{
    		state: "TX",
    		county: "Angelina County",
    		avgInfected: 208.08333333333334
    	},
    	{
    		state: "TX",
    		county: "Aransas County",
    		avgInfected: 31.333333333333332
    	},
    	{
    		state: "TX",
    		county: "Archer County",
    		avgInfected: 18.333333333333332
    	},
    	{
    		state: "TX",
    		county: "Armstrong County",
    		avgInfected: 3.1666666666666665
    	},
    	{
    		state: "TX",
    		county: "Atascosa County",
    		avgInfected: 118
    	},
    	{
    		state: "TX",
    		county: "Austin County",
    		avgInfected: 46
    	},
    	{
    		state: "TX",
    		county: "Bailey County",
    		avgInfected: 36.25
    	},
    	{
    		state: "TX",
    		county: "Bandera County",
    		avgInfected: 17.916666666666668
    	},
    	{
    		state: "TX",
    		county: "Bastrop County",
    		avgInfected: 182.16666666666666
    	},
    	{
    		state: "TX",
    		county: "Baylor County",
    		avgInfected: 4.333333333333333
    	},
    	{
    		state: "TX",
    		county: "Bee County",
    		avgInfected: 161.08333333333334
    	},
    	{
    		state: "TX",
    		county: "Bell County",
    		avgInfected: 651.6666666666666
    	},
    	{
    		state: "TX",
    		county: "Bexar County",
    		avgInfected: 5948.083333333333
    	},
    	{
    		state: "TX",
    		county: "Blanco County",
    		avgInfected: 14.5
    	},
    	{
    		state: "TX",
    		county: "Borden County",
    		avgInfected: 0.3333333333333333
    	},
    	{
    		state: "TX",
    		county: "Bosque County",
    		avgInfected: 41.666666666666664
    	},
    	{
    		state: "TX",
    		county: "Bowie County",
    		avgInfected: 200.41666666666666
    	},
    	{
    		state: "TX",
    		county: "Brazoria County",
    		avgInfected: 1126.3333333333333
    	},
    	{
    		state: "TX",
    		county: "Brazos County",
    		avgInfected: 733.5833333333334
    	},
    	{
    		state: "TX",
    		county: "Brewster County",
    		avgInfected: 34.916666666666664
    	},
    	{
    		state: "TX",
    		county: "Briscoe County",
    		avgInfected: 3.0833333333333335
    	},
    	{
    		state: "TX",
    		county: "Brooks County",
    		avgInfected: 32
    	},
    	{
    		state: "TX",
    		county: "Brown County",
    		avgInfected: 72.25
    	},
    	{
    		state: "TX",
    		county: "Burleson County",
    		avgInfected: 50.25
    	},
    	{
    		state: "TX",
    		county: "Burnet County",
    		avgInfected: 108.08333333333333
    	},
    	{
    		state: "TX",
    		county: "Caldwell County",
    		avgInfected: 150.16666666666666
    	},
    	{
    		state: "TX",
    		county: "Calhoun County",
    		avgInfected: 80.33333333333333
    	},
    	{
    		state: "TX",
    		county: "Callahan County",
    		avgInfected: 15.75
    	},
    	{
    		state: "TX",
    		county: "Cameron County",
    		avgInfected: 2109
    	},
    	{
    		state: "TX",
    		county: "Camp County",
    		avgInfected: 36.333333333333336
    	},
    	{
    		state: "TX",
    		county: "Carson County",
    		avgInfected: 7.083333333333333
    	},
    	{
    		state: "TX",
    		county: "Cass County",
    		avgInfected: 59.5
    	},
    	{
    		state: "TX",
    		county: "Castro County",
    		avgInfected: 34.5
    	},
    	{
    		state: "TX",
    		county: "Chambers County",
    		avgInfected: 151.25
    	},
    	{
    		state: "TX",
    		county: "Cherokee County",
    		avgInfected: 140.83333333333334
    	},
    	{
    		state: "TX",
    		county: "Childress County",
    		avgInfected: 67.33333333333333
    	},
    	{
    		state: "TX",
    		county: "Clay County",
    		avgInfected: 18.916666666666668
    	},
    	{
    		state: "TX",
    		county: "Cochran County",
    		avgInfected: 12.416666666666666
    	},
    	{
    		state: "TX",
    		county: "Coke County",
    		avgInfected: 13.083333333333334
    	},
    	{
    		state: "TX",
    		county: "Coleman County",
    		avgInfected: 14.333333333333334
    	},
    	{
    		state: "TX",
    		county: "Collin County",
    		avgInfected: 1861.4166666666667
    	},
    	{
    		state: "TX",
    		county: "Collingsworth County",
    		avgInfected: 2.8333333333333335
    	},
    	{
    		state: "TX",
    		county: "Colorado County",
    		avgInfected: 46
    	},
    	{
    		state: "TX",
    		county: "Comal County",
    		avgInfected: 254.66666666666666
    	},
    	{
    		state: "TX",
    		county: "Comanche County",
    		avgInfected: 34.583333333333336
    	},
    	{
    		state: "TX",
    		county: "Concho County",
    		avgInfected: 14.916666666666666
    	},
    	{
    		state: "TX",
    		county: "Cooke County",
    		avgInfected: 58.416666666666664
    	},
    	{
    		state: "TX",
    		county: "Coryell County",
    		avgInfected: 187.33333333333334
    	},
    	{
    		state: "TX",
    		county: "Cottle County",
    		avgInfected: 4.083333333333333
    	},
    	{
    		state: "TX",
    		county: "Crane County",
    		avgInfected: 13
    	},
    	{
    		state: "TX",
    		county: "Crockett County",
    		avgInfected: 17.5
    	},
    	{
    		state: "TX",
    		county: "Crosby County",
    		avgInfected: 13.583333333333334
    	},
    	{
    		state: "TX",
    		county: "Culberson County",
    		avgInfected: 13
    	},
    	{
    		state: "TX",
    		county: "Dallam County",
    		avgInfected: 35.583333333333336
    	},
    	{
    		state: "TX",
    		county: "Dallas County",
    		avgInfected: 9330
    	},
    	{
    		state: "TX",
    		county: "Dawson County",
    		avgInfected: 94
    	},
    	{
    		state: "TX",
    		county: "Deaf Smith County",
    		avgInfected: 101.41666666666667
    	},
    	{
    		state: "TX",
    		county: "Delta County",
    		avgInfected: 3.75
    	},
    	{
    		state: "TX",
    		county: "Denton County",
    		avgInfected: 1462.75
    	},
    	{
    		state: "TX",
    		county: "DeWitt County",
    		avgInfected: 97.25
    	},
    	{
    		state: "TX",
    		county: "Dickens County",
    		avgInfected: 5.333333333333333
    	},
    	{
    		state: "TX",
    		county: "Dimmit County",
    		avgInfected: 27.916666666666668
    	},
    	{
    		state: "TX",
    		county: "Donley County",
    		avgInfected: 8.916666666666666
    	},
    	{
    		state: "TX",
    		county: "Duval County",
    		avgInfected: 45.5
    	},
    	{
    		state: "TX",
    		county: "Eastland County",
    		avgInfected: 27.583333333333332
    	},
    	{
    		state: "TX",
    		county: "Ector County",
    		avgInfected: 405.3333333333333
    	},
    	{
    		state: "TX",
    		county: "Edwards County",
    		avgInfected: 6.75
    	},
    	{
    		state: "TX",
    		county: "Ellis County",
    		avgInfected: 500.6666666666667
    	},
    	{
    		state: "TX",
    		county: "El Paso County",
    		avgInfected: 6498.083333333333
    	},
    	{
    		state: "TX",
    		county: "Erath County",
    		avgInfected: 103.25
    	},
    	{
    		state: "TX",
    		county: "Falls County",
    		avgInfected: 62.083333333333336
    	},
    	{
    		state: "TX",
    		county: "Fannin County",
    		avgInfected: 77
    	},
    	{
    		state: "TX",
    		county: "Fayette County",
    		avgInfected: 47.5
    	},
    	{
    		state: "TX",
    		county: "Fisher County",
    		avgInfected: 11.916666666666666
    	},
    	{
    		state: "TX",
    		county: "Floyd County",
    		avgInfected: 15.416666666666666
    	},
    	{
    		state: "TX",
    		county: "Foard County",
    		avgInfected: 2.0833333333333335
    	},
    	{
    		state: "TX",
    		county: "Fort Bend County",
    		avgInfected: 1581
    	},
    	{
    		state: "TX",
    		county: "Franklin County",
    		avgInfected: 20.333333333333332
    	},
    	{
    		state: "TX",
    		county: "Freestone County",
    		avgInfected: 40.916666666666664
    	},
    	{
    		state: "TX",
    		county: "Frio County",
    		avgInfected: 90.16666666666667
    	},
    	{
    		state: "TX",
    		county: "Gaines County",
    		avgInfected: 70.33333333333333
    	},
    	{
    		state: "TX",
    		county: "Galveston County",
    		avgInfected: 1152.25
    	},
    	{
    		state: "TX",
    		county: "Garza County",
    		avgInfected: 13.25
    	},
    	{
    		state: "TX",
    		county: "Gillespie County",
    		avgInfected: 36.333333333333336
    	},
    	{
    		state: "TX",
    		county: "Glasscock County",
    		avgInfected: 2.4166666666666665
    	},
    	{
    		state: "TX",
    		county: "Goliad County",
    		avgInfected: 14.333333333333334
    	},
    	{
    		state: "TX",
    		county: "Gonzales County",
    		avgInfected: 100.25
    	},
    	{
    		state: "TX",
    		county: "Gray County",
    		avgInfected: 96.91666666666667
    	},
    	{
    		state: "TX",
    		county: "Grayson County",
    		avgInfected: 310.5833333333333
    	},
    	{
    		state: "TX",
    		county: "Gregg County",
    		avgInfected: 254.91666666666666
    	},
    	{
    		state: "TX",
    		county: "Grimes County",
    		avgInfected: 108.83333333333333
    	},
    	{
    		state: "TX",
    		county: "Guadalupe County",
    		avgInfected: 344.3333333333333
    	},
    	{
    		state: "TX",
    		county: "Hale County",
    		avgInfected: 304.3333333333333
    	},
    	{
    		state: "TX",
    		county: "Hall County",
    		avgInfected: 6.083333333333333
    	},
    	{
    		state: "TX",
    		county: "Hamilton County",
    		avgInfected: 22.333333333333332
    	},
    	{
    		state: "TX",
    		county: "Hansford County",
    		avgInfected: 18.75
    	},
    	{
    		state: "TX",
    		county: "Hardeman County",
    		avgInfected: 6.333333333333333
    	},
    	{
    		state: "TX",
    		county: "Hardin County",
    		avgInfected: 129.08333333333334
    	},
    	{
    		state: "TX",
    		county: "Harris County",
    		avgInfected: 14788.833333333334
    	},
    	{
    		state: "TX",
    		county: "Harrison County",
    		avgInfected: 101
    	},
    	{
    		state: "TX",
    		county: "Hartley County",
    		avgInfected: 16.666666666666668
    	},
    	{
    		state: "TX",
    		county: "Haskell County",
    		avgInfected: 7.75
    	},
    	{
    		state: "TX",
    		county: "Hays County",
    		avgInfected: 569.4166666666666
    	},
    	{
    		state: "TX",
    		county: "Hemphill County",
    		avgInfected: 19.416666666666668
    	},
    	{
    		state: "TX",
    		county: "Henderson County",
    		avgInfected: 137.5
    	},
    	{
    		state: "TX",
    		county: "Hidalgo County",
    		avgInfected: 3223.9166666666665
    	},
    	{
    		state: "TX",
    		county: "Hill County",
    		avgInfected: 87.16666666666667
    	},
    	{
    		state: "TX",
    		county: "Hockley County",
    		avgInfected: 99.91666666666667
    	},
    	{
    		state: "TX",
    		county: "Hood County",
    		avgInfected: 119.66666666666667
    	},
    	{
    		state: "TX",
    		county: "Hopkins County",
    		avgInfected: 65.5
    	},
    	{
    		state: "TX",
    		county: "Houston County",
    		avgInfected: 38.25
    	},
    	{
    		state: "TX",
    		county: "Howard County",
    		avgInfected: 131.08333333333334
    	},
    	{
    		state: "TX",
    		county: "Hudspeth County",
    		avgInfected: 13.25
    	},
    	{
    		state: "TX",
    		county: "Hunt County",
    		avgInfected: 209.58333333333334
    	},
    	{
    		state: "TX",
    		county: "Hutchinson County",
    		avgInfected: 50
    	},
    	{
    		state: "TX",
    		county: "Irion County",
    		avgInfected: 1.3333333333333333
    	},
    	{
    		state: "TX",
    		county: "Jack County",
    		avgInfected: 17.583333333333332
    	},
    	{
    		state: "TX",
    		county: "Jackson County",
    		avgInfected: 63.333333333333336
    	},
    	{
    		state: "TX",
    		county: "Jasper County",
    		avgInfected: 44.666666666666664
    	},
    	{
    		state: "TX",
    		county: "Jeff Davis County",
    		avgInfected: 2.5
    	},
    	{
    		state: "TX",
    		county: "Jefferson County",
    		avgInfected: 804.9166666666666
    	},
    	{
    		state: "TX",
    		county: "Jim Hogg County",
    		avgInfected: 16.25
    	},
    	{
    		state: "TX",
    		county: "Jim Wells County",
    		avgInfected: 156.5
    	},
    	{
    		state: "TX",
    		county: "Johnson County",
    		avgInfected: 393
    	},
    	{
    		state: "TX",
    		county: "Jones County",
    		avgInfected: 132.33333333333334
    	},
    	{
    		state: "TX",
    		county: "Karnes County",
    		avgInfected: 82.16666666666667
    	},
    	{
    		state: "TX",
    		county: "Kaufman County",
    		avgInfected: 353.6666666666667
    	},
    	{
    		state: "TX",
    		county: "Kendall County",
    		avgInfected: 39.5
    	},
    	{
    		state: "TX",
    		county: "Kenedy County",
    		avgInfected: 0.9166666666666666
    	},
    	{
    		state: "TX",
    		county: "Kent County",
    		avgInfected: 1.75
    	},
    	{
    		state: "TX",
    		county: "Kerr County",
    		avgInfected: 70
    	},
    	{
    		state: "TX",
    		county: "Kimble County",
    		avgInfected: 6.166666666666667
    	},
    	{
    		state: "TX",
    		county: "King County",
    		avgInfected: 0.08333333333333333
    	},
    	{
    		state: "TX",
    		county: "Kinney County",
    		avgInfected: 7.083333333333333
    	},
    	{
    		state: "TX",
    		county: "Kleberg County",
    		avgInfected: 93.66666666666667
    	},
    	{
    		state: "TX",
    		county: "Knox County",
    		avgInfected: 9.666666666666666
    	},
    	{
    		state: "TX",
    		county: "Lamar County",
    		avgInfected: 198.75
    	},
    	{
    		state: "TX",
    		county: "Lamb County",
    		avgInfected: 74.41666666666667
    	},
    	{
    		state: "TX",
    		county: "Lampasas County",
    		avgInfected: 29.583333333333332
    	},
    	{
    		state: "TX",
    		county: "La Salle County",
    		avgInfected: 32
    	},
    	{
    		state: "TX",
    		county: "Lavaca County",
    		avgInfected: 110.41666666666667
    	},
    	{
    		state: "TX",
    		county: "Lee County",
    		avgInfected: 22.666666666666668
    	},
    	{
    		state: "TX",
    		county: "Leon County",
    		avgInfected: 35.25
    	},
    	{
    		state: "TX",
    		county: "Liberty County",
    		avgInfected: 198.58333333333334
    	},
    	{
    		state: "TX",
    		county: "Limestone County",
    		avgInfected: 62.333333333333336
    	},
    	{
    		state: "TX",
    		county: "Lipscomb County",
    		avgInfected: 10.083333333333334
    	},
    	{
    		state: "TX",
    		county: "Live Oak County",
    		avgInfected: 34.333333333333336
    	},
    	{
    		state: "TX",
    		county: "Llano County",
    		avgInfected: 21.416666666666668
    	},
    	{
    		state: "TX",
    		county: "Loving County",
    		avgInfected: 0.08333333333333333
    	},
    	{
    		state: "TX",
    		county: "Lubbock County",
    		avgInfected: 2258.75
    	},
    	{
    		state: "TX",
    		county: "Lynn County",
    		avgInfected: 24.833333333333332
    	},
    	{
    		state: "TX",
    		county: "McCulloch County",
    		avgInfected: 22.416666666666668
    	},
    	{
    		state: "TX",
    		county: "McLennan County",
    		avgInfected: 1063.4166666666667
    	},
    	{
    		state: "TX",
    		county: "McMullen County",
    		avgInfected: 2.1666666666666665
    	},
    	{
    		state: "TX",
    		county: "Madison County",
    		avgInfected: 69.33333333333333
    	},
    	{
    		state: "TX",
    		county: "Marion County",
    		avgInfected: 15.166666666666666
    	},
    	{
    		state: "TX",
    		county: "Martin County",
    		avgInfected: 13.5
    	},
    	{
    		state: "TX",
    		county: "Mason County",
    		avgInfected: 11.083333333333334
    	},
    	{
    		state: "TX",
    		county: "Matagorda County",
    		avgInfected: 98.33333333333333
    	},
    	{
    		state: "TX",
    		county: "Maverick County",
    		avgInfected: 390.8333333333333
    	},
    	{
    		state: "TX",
    		county: "Medina County",
    		avgInfected: 113.16666666666667
    	},
    	{
    		state: "TX",
    		county: "Menard County",
    		avgInfected: 8.333333333333334
    	},
    	{
    		state: "TX",
    		county: "Midland County",
    		avgInfected: 548
    	},
    	{
    		state: "TX",
    		county: "Milam County",
    		avgInfected: 50.416666666666664
    	},
    	{
    		state: "TX",
    		county: "Mills County",
    		avgInfected: 9.666666666666666
    	},
    	{
    		state: "TX",
    		county: "Mitchell County",
    		avgInfected: 22.666666666666668
    	},
    	{
    		state: "TX",
    		county: "Montague County",
    		avgInfected: 40.25
    	},
    	{
    		state: "TX",
    		county: "Montgomery County",
    		avgInfected: 1194.25
    	},
    	{
    		state: "TX",
    		county: "Moore County",
    		avgInfected: 127.83333333333333
    	},
    	{
    		state: "TX",
    		county: "Morris County",
    		avgInfected: 21.666666666666668
    	},
    	{
    		state: "TX",
    		county: "Motley County",
    		avgInfected: 1.5833333333333333
    	},
    	{
    		state: "TX",
    		county: "Nacogdoches County",
    		avgInfected: 159.58333333333334
    	},
    	{
    		state: "TX",
    		county: "Navarro County",
    		avgInfected: 139.08333333333334
    	},
    	{
    		state: "TX",
    		county: "Newton County",
    		avgInfected: 16.083333333333332
    	},
    	{
    		state: "TX",
    		county: "Nolan County",
    		avgInfected: 50.333333333333336
    	},
    	{
    		state: "TX",
    		county: "Nueces County",
    		avgInfected: 1406.3333333333333
    	},
    	{
    		state: "TX",
    		county: "Ochiltree County",
    		avgInfected: 46.25
    	},
    	{
    		state: "TX",
    		county: "Oldham County",
    		avgInfected: 2.6666666666666665
    	},
    	{
    		state: "TX",
    		county: "Orange County",
    		avgInfected: 203.25
    	},
    	{
    		state: "TX",
    		county: "Palo Pinto County",
    		avgInfected: 73.25
    	},
    	{
    		state: "TX",
    		county: "Panola County",
    		avgInfected: 43.416666666666664
    	},
    	{
    		state: "TX",
    		county: "Parker County",
    		avgInfected: 274.9166666666667
    	},
    	{
    		state: "TX",
    		county: "Parmer County",
    		avgInfected: 54.75
    	},
    	{
    		state: "TX",
    		county: "Pecos County",
    		avgInfected: 56.5
    	},
    	{
    		state: "TX",
    		county: "Polk County",
    		avgInfected: 82.33333333333333
    	},
    	{
    		state: "TX",
    		county: "Potter County",
    		avgInfected: 921
    	},
    	{
    		state: "TX",
    		county: "Presidio County",
    		avgInfected: 21.75
    	},
    	{
    		state: "TX",
    		county: "Rains County",
    		avgInfected: 11.833333333333334
    	},
    	{
    		state: "TX",
    		county: "Randall County",
    		avgInfected: 736.4166666666666
    	},
    	{
    		state: "TX",
    		county: "Reagan County",
    		avgInfected: 12.916666666666666
    	},
    	{
    		state: "TX",
    		county: "Real County",
    		avgInfected: 10.833333333333334
    	},
    	{
    		state: "TX",
    		county: "Red River County",
    		avgInfected: 17.916666666666668
    	},
    	{
    		state: "TX",
    		county: "Reeves County",
    		avgInfected: 36.25
    	},
    	{
    		state: "TX",
    		county: "Refugio County",
    		avgInfected: 27.666666666666668
    	},
    	{
    		state: "TX",
    		county: "Roberts County",
    		avgInfected: 2.0833333333333335
    	},
    	{
    		state: "TX",
    		county: "Robertson County",
    		avgInfected: 38.583333333333336
    	},
    	{
    		state: "TX",
    		county: "Rockwall County",
    		avgInfected: 207.25
    	},
    	{
    		state: "TX",
    		county: "Runnels County",
    		avgInfected: 27.583333333333332
    	},
    	{
    		state: "TX",
    		county: "Rusk County",
    		avgInfected: 95.33333333333333
    	},
    	{
    		state: "TX",
    		county: "Sabine County",
    		avgInfected: 10
    	},
    	{
    		state: "TX",
    		county: "San Augustine County",
    		avgInfected: 21.166666666666668
    	},
    	{
    		state: "TX",
    		county: "San Jacinto County",
    		avgInfected: 20.833333333333332
    	},
    	{
    		state: "TX",
    		county: "San Patricio County",
    		avgInfected: 145.58333333333334
    	},
    	{
    		state: "TX",
    		county: "San Saba County",
    		avgInfected: 24.25
    	},
    	{
    		state: "TX",
    		county: "Schleicher County",
    		avgInfected: 8.333333333333334
    	},
    	{
    		state: "TX",
    		county: "Scurry County",
    		avgInfected: 120.75
    	},
    	{
    		state: "TX",
    		county: "Shackelford County",
    		avgInfected: 3.8333333333333335
    	},
    	{
    		state: "TX",
    		county: "Shelby County",
    		avgInfected: 49.083333333333336
    	},
    	{
    		state: "TX",
    		county: "Sherman County",
    		avgInfected: 7.25
    	},
    	{
    		state: "TX",
    		county: "Smith County",
    		avgInfected: 464.4166666666667
    	},
    	{
    		state: "TX",
    		county: "Somervell County",
    		avgInfected: 18.666666666666668
    	},
    	{
    		state: "TX",
    		county: "Starr County",
    		avgInfected: 313.9166666666667
    	},
    	{
    		state: "TX",
    		county: "Stephens County",
    		avgInfected: 18.666666666666668
    	},
    	{
    		state: "TX",
    		county: "Sterling County",
    		avgInfected: 2.5
    	},
    	{
    		state: "TX",
    		county: "Stonewall County",
    		avgInfected: 2
    	},
    	{
    		state: "TX",
    		county: "Sutton County",
    		avgInfected: 14.416666666666666
    	},
    	{
    		state: "TX",
    		county: "Swisher County",
    		avgInfected: 18.333333333333332
    	},
    	{
    		state: "TX",
    		county: "Tarrant County",
    		avgInfected: 6345
    	},
    	{
    		state: "TX",
    		county: "Taylor County",
    		avgInfected: 249.16666666666666
    	},
    	{
    		state: "TX",
    		county: "Terrell County",
    		avgInfected: 0.9166666666666666
    	},
    	{
    		state: "TX",
    		county: "Terry County",
    		avgInfected: 70.91666666666667
    	},
    	{
    		state: "TX",
    		county: "Throckmorton County",
    		avgInfected: 1.8333333333333333
    	},
    	{
    		state: "TX",
    		county: "Titus County",
    		avgInfected: 144.25
    	},
    	{
    		state: "TX",
    		county: "Tom Green County",
    		avgInfected: 260
    	},
    	{
    		state: "TX",
    		county: "Travis County",
    		avgInfected: 2943.8333333333335
    	},
    	{
    		state: "TX",
    		county: "Trinity County",
    		avgInfected: 18.75
    	},
    	{
    		state: "TX",
    		county: "Tyler County",
    		avgInfected: 24.25
    	},
    	{
    		state: "TX",
    		county: "Upshur County",
    		avgInfected: 48.333333333333336
    	},
    	{
    		state: "TX",
    		county: "Upton County",
    		avgInfected: 3.5833333333333335
    	},
    	{
    		state: "TX",
    		county: "Uvalde County",
    		avgInfected: 84.5
    	},
    	{
    		state: "TX",
    		county: "Val Verde County",
    		avgInfected: 244.33333333333334
    	},
    	{
    		state: "TX",
    		county: "Van Zandt County",
    		avgInfected: 83.91666666666667
    	},
    	{
    		state: "TX",
    		county: "Victoria County",
    		avgInfected: 394.4166666666667
    	},
    	{
    		state: "TX",
    		county: "Walker County",
    		avgInfected: 337.75
    	},
    	{
    		state: "TX",
    		county: "Waller County",
    		avgInfected: 88.58333333333333
    	},
    	{
    		state: "TX",
    		county: "Ward County",
    		avgInfected: 25.5
    	},
    	{
    		state: "TX",
    		county: "Washington County",
    		avgInfected: 73.83333333333333
    	},
    	{
    		state: "TX",
    		county: "Webb County",
    		avgInfected: 1509.0833333333333
    	},
    	{
    		state: "TX",
    		county: "Wharton County",
    		avgInfected: 128.33333333333334
    	},
    	{
    		state: "TX",
    		county: "Wheeler County",
    		avgInfected: 16.666666666666668
    	},
    	{
    		state: "TX",
    		county: "Wichita County",
    		avgInfected: 487.75
    	},
    	{
    		state: "TX",
    		county: "Wilbarger County",
    		avgInfected: 46.583333333333336
    	},
    	{
    		state: "TX",
    		county: "Willacy County",
    		avgInfected: 108.66666666666667
    	},
    	{
    		state: "TX",
    		county: "Williamson County",
    		avgInfected: 932
    	},
    	{
    		state: "TX",
    		county: "Wilson County",
    		avgInfected: 89.75
    	},
    	{
    		state: "TX",
    		county: "Winkler County",
    		avgInfected: 20.666666666666668
    	},
    	{
    		state: "TX",
    		county: "Wise County",
    		avgInfected: 113.08333333333333
    	},
    	{
    		state: "TX",
    		county: "Wood County",
    		avgInfected: 69.66666666666667
    	},
    	{
    		state: "TX",
    		county: "Yoakum County",
    		avgInfected: 47.833333333333336
    	},
    	{
    		state: "TX",
    		county: "Young County",
    		avgInfected: 64.5
    	},
    	{
    		state: "TX",
    		county: "Zapata County",
    		avgInfected: 35.416666666666664
    	},
    	{
    		state: "TX",
    		county: "Zavala County",
    		avgInfected: 45.666666666666664
    	},
    	{
    		state: "UT",
    		county: "Statewide Unallocated",
    		avgInfected: 23.333333333333332
    	},
    	{
    		state: "UT",
    		county: "Beaver County",
    		avgInfected: 11.333333333333334
    	},
    	{
    		state: "UT",
    		county: "Box Elder County",
    		avgInfected: 148.25
    	},
    	{
    		state: "UT",
    		county: "Cache County",
    		avgInfected: 538
    	},
    	{
    		state: "UT",
    		county: "Carbon County",
    		avgInfected: 48.666666666666664
    	},
    	{
    		state: "UT",
    		county: "Daggett County",
    		avgInfected: 0.08333333333333333
    	},
    	{
    		state: "UT",
    		county: "Davis County",
    		avgInfected: 1134.5
    	},
    	{
    		state: "UT",
    		county: "Duchesne County",
    		avgInfected: 33
    	},
    	{
    		state: "UT",
    		county: "Emery County",
    		avgInfected: 18.833333333333332
    	},
    	{
    		state: "UT",
    		county: "Garfield County",
    		avgInfected: 17.5
    	},
    	{
    		state: "UT",
    		county: "Grand County",
    		avgInfected: 20
    	},
    	{
    		state: "UT",
    		county: "Iron County",
    		avgInfected: 119.16666666666667
    	},
    	{
    		state: "UT",
    		county: "Juab County",
    		avgInfected: 32.916666666666664
    	},
    	{
    		state: "UT",
    		county: "Kane County",
    		avgInfected: 11.416666666666666
    	},
    	{
    		state: "UT",
    		county: "Millard County",
    		avgInfected: 30.583333333333332
    	},
    	{
    		state: "UT",
    		county: "Morgan County",
    		avgInfected: 34.166666666666664
    	},
    	{
    		state: "UT",
    		county: "Piute County",
    		avgInfected: 3.4166666666666665
    	},
    	{
    		state: "UT",
    		county: "Rich County",
    		avgInfected: 3.0833333333333335
    	},
    	{
    		state: "UT",
    		county: "Salt Lake County",
    		avgInfected: 5791.916666666667
    	},
    	{
    		state: "UT",
    		county: "San Juan County",
    		avgInfected: 79.91666666666667
    	},
    	{
    		state: "UT",
    		county: "Sanpete County",
    		avgInfected: 71.58333333333333
    	},
    	{
    		state: "UT",
    		county: "Sevier County",
    		avgInfected: 61.416666666666664
    	},
    	{
    		state: "UT",
    		county: "Summit County",
    		avgInfected: 165.08333333333334
    	},
    	{
    		state: "UT",
    		county: "Tooele County",
    		avgInfected: 200.91666666666666
    	},
    	{
    		state: "UT",
    		county: "Uintah County",
    		avgInfected: 48.583333333333336
    	},
    	{
    		state: "UT",
    		county: "Utah County",
    		avgInfected: 3508
    	},
    	{
    		state: "UT",
    		county: "Wasatch County",
    		avgInfected: 146.66666666666666
    	},
    	{
    		state: "UT",
    		county: "Washington County",
    		avgInfected: 647.0833333333334
    	},
    	{
    		state: "UT",
    		county: "Wayne County",
    		avgInfected: 3.75
    	},
    	{
    		state: "UT",
    		county: "Weber County",
    		avgInfected: 890
    	},
    	{
    		state: "VT",
    		county: "Statewide Unallocated",
    		avgInfected: 0.6666666666666666
    	},
    	{
    		state: "VT",
    		county: "Addison County",
    		avgInfected: 12.916666666666666
    	},
    	{
    		state: "VT",
    		county: "Bennington County",
    		avgInfected: 14.416666666666666
    	},
    	{
    		state: "VT",
    		county: "Caledonia County",
    		avgInfected: 7.083333333333333
    	},
    	{
    		state: "VT",
    		county: "Chittenden County",
    		avgInfected: 107.41666666666667
    	},
    	{
    		state: "VT",
    		county: "Essex County",
    		avgInfected: 2.1666666666666665
    	},
    	{
    		state: "VT",
    		county: "Franklin County",
    		avgInfected: 15.25
    	},
    	{
    		state: "VT",
    		county: "Grand Isle County",
    		avgInfected: 3
    	},
    	{
    		state: "VT",
    		county: "Lamoille County",
    		avgInfected: 10.166666666666666
    	},
    	{
    		state: "VT",
    		county: "Orange County",
    		avgInfected: 11.333333333333334
    	},
    	{
    		state: "VT",
    		county: "Orleans County",
    		avgInfected: 7.166666666666667
    	},
    	{
    		state: "VT",
    		county: "Rutland County",
    		avgInfected: 16.5
    	},
    	{
    		state: "VT",
    		county: "Washington County",
    		avgInfected: 39.166666666666664
    	},
    	{
    		state: "VT",
    		county: "Windham County",
    		avgInfected: 15.416666666666666
    	},
    	{
    		state: "VT",
    		county: "Windsor County",
    		avgInfected: 13.166666666666666
    	},
    	{
    		state: "VA",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "VA",
    		county: "Accomack County",
    		avgInfected: 106.58333333333333
    	},
    	{
    		state: "VA",
    		county: "Albemarle County",
    		avgInfected: 146.25
    	},
    	{
    		state: "VA",
    		county: "Alleghany County",
    		avgInfected: 21.583333333333332
    	},
    	{
    		state: "VA",
    		county: "Amelia County",
    		avgInfected: 13.75
    	},
    	{
    		state: "VA",
    		county: "Amherst County",
    		avgInfected: 58.25
    	},
    	{
    		state: "VA",
    		county: "Appomattox County",
    		avgInfected: 30.166666666666668
    	},
    	{
    		state: "VA",
    		county: "Arlington County",
    		avgInfected: 462
    	},
    	{
    		state: "VA",
    		county: "Augusta County",
    		avgInfected: 79.5
    	},
    	{
    		state: "VA",
    		county: "Bath County",
    		avgInfected: 3.8333333333333335
    	},
    	{
    		state: "VA",
    		county: "Bedford County",
    		avgInfected: 133.83333333333334
    	},
    	{
    		state: "VA",
    		county: "Bland County",
    		avgInfected: 9.25
    	},
    	{
    		state: "VA",
    		county: "Botetourt County",
    		avgInfected: 54.5
    	},
    	{
    		state: "VA",
    		county: "Brunswick County",
    		avgInfected: 37.75
    	},
    	{
    		state: "VA",
    		county: "Buchanan County",
    		avgInfected: 29.25
    	},
    	{
    		state: "VA",
    		county: "Buckingham County",
    		avgInfected: 69.75
    	},
    	{
    		state: "VA",
    		county: "Campbell County",
    		avgInfected: 80.83333333333333
    	},
    	{
    		state: "VA",
    		county: "Caroline County",
    		avgInfected: 43.916666666666664
    	},
    	{
    		state: "VA",
    		county: "Carroll County",
    		avgInfected: 67.16666666666667
    	},
    	{
    		state: "VA",
    		county: "Charles City County",
    		avgInfected: 10.416666666666666
    	},
    	{
    		state: "VA",
    		county: "Charlotte County",
    		avgInfected: 22
    	},
    	{
    		state: "VA",
    		county: "Chesterfield County",
    		avgInfected: 696.9166666666666
    	},
    	{
    		state: "VA",
    		county: "Clarke County",
    		avgInfected: 14.333333333333334
    	},
    	{
    		state: "VA",
    		county: "Craig County",
    		avgInfected: 6.25
    	},
    	{
    		state: "VA",
    		county: "Culpeper County",
    		avgInfected: 154.5
    	},
    	{
    		state: "VA",
    		county: "Cumberland County",
    		avgInfected: 11.583333333333334
    	},
    	{
    		state: "VA",
    		county: "Dickenson County",
    		avgInfected: 19.083333333333332
    	},
    	{
    		state: "VA",
    		county: "Dinwiddie County",
    		avgInfected: 51
    	},
    	{
    		state: "VA",
    		county: "Essex County",
    		avgInfected: 18.416666666666668
    	},
    	{
    		state: "VA",
    		county: "Fairfax County",
    		avgInfected: 2289.5833333333335
    	},
    	{
    		state: "VA",
    		county: "Fauquier County",
    		avgInfected: 109.08333333333333
    	},
    	{
    		state: "VA",
    		county: "Floyd County",
    		avgInfected: 24.833333333333332
    	},
    	{
    		state: "VA",
    		county: "Fluvanna County",
    		avgInfected: 39
    	},
    	{
    		state: "VA",
    		county: "Franklin County",
    		avgInfected: 111.91666666666667
    	},
    	{
    		state: "VA",
    		county: "Frederick County",
    		avgInfected: 142
    	},
    	{
    		state: "VA",
    		county: "Giles County",
    		avgInfected: 18.083333333333332
    	},
    	{
    		state: "VA",
    		county: "Gloucester County",
    		avgInfected: 32.583333333333336
    	},
    	{
    		state: "VA",
    		county: "Goochland County",
    		avgInfected: 31.833333333333332
    	},
    	{
    		state: "VA",
    		county: "Grayson County",
    		avgInfected: 39.416666666666664
    	},
    	{
    		state: "VA",
    		county: "Greene County",
    		avgInfected: 28.166666666666668
    	},
    	{
    		state: "VA",
    		county: "Greensville County",
    		avgInfected: 77.08333333333333
    	},
    	{
    		state: "VA",
    		county: "Halifax County",
    		avgInfected: 62.666666666666664
    	},
    	{
    		state: "VA",
    		county: "Hanover County",
    		avgInfected: 174.16666666666666
    	},
    	{
    		state: "VA",
    		county: "Henrico County",
    		avgInfected: 625.75
    	},
    	{
    		state: "VA",
    		county: "Henry County",
    		avgInfected: 137.66666666666666
    	},
    	{
    		state: "VA",
    		county: "Highland County",
    		avgInfected: 1.1666666666666667
    	},
    	{
    		state: "VA",
    		county: "Isle of Wight County",
    		avgInfected: 79.16666666666667
    	},
    	{
    		state: "VA",
    		county: "James City County",
    		avgInfected: 90.16666666666667
    	},
    	{
    		state: "VA",
    		county: "King and Queen County",
    		avgInfected: 8.25
    	},
    	{
    		state: "VA",
    		county: "King George County",
    		avgInfected: 29.166666666666668
    	},
    	{
    		state: "VA",
    		county: "King William County",
    		avgInfected: 21.916666666666668
    	},
    	{
    		state: "VA",
    		county: "Lancaster County",
    		avgInfected: 18.583333333333332
    	},
    	{
    		state: "VA",
    		county: "Lee County",
    		avgInfected: 64.75
    	},
    	{
    		state: "VA",
    		county: "Loudoun County",
    		avgInfected: 753.8333333333334
    	},
    	{
    		state: "VA",
    		county: "Louisa County",
    		avgInfected: 38.083333333333336
    	},
    	{
    		state: "VA",
    		county: "Lunenburg County",
    		avgInfected: 13.416666666666666
    	},
    	{
    		state: "VA",
    		county: "Madison County",
    		avgInfected: 14.25
    	},
    	{
    		state: "VA",
    		county: "Matthews County",
    		avgInfected: 12.583333333333334
    	},
    	{
    		state: "VA",
    		county: "Mecklenburg County",
    		avgInfected: 79.83333333333333
    	},
    	{
    		state: "VA",
    		county: "Middlesex County",
    		avgInfected: 12.666666666666666
    	},
    	{
    		state: "VA",
    		county: "Montgomery County",
    		avgInfected: 295.5833333333333
    	},
    	{
    		state: "VA",
    		county: "Nelson County",
    		avgInfected: 12.916666666666666
    	},
    	{
    		state: "VA",
    		county: "New Kent County",
    		avgInfected: 28.583333333333332
    	},
    	{
    		state: "VA",
    		county: "Northampton County",
    		avgInfected: 27.833333333333332
    	},
    	{
    		state: "VA",
    		county: "Northumberland County",
    		avgInfected: 20.416666666666668
    	},
    	{
    		state: "VA",
    		county: "Nottoway County",
    		avgInfected: 39.5
    	},
    	{
    		state: "VA",
    		county: "Orange County",
    		avgInfected: 41.833333333333336
    	},
    	{
    		state: "VA",
    		county: "Page County",
    		avgInfected: 45.333333333333336
    	},
    	{
    		state: "VA",
    		county: "Patrick County",
    		avgInfected: 34.333333333333336
    	},
    	{
    		state: "VA",
    		county: "Pittsylvania County",
    		avgInfected: 129.5
    	},
    	{
    		state: "VA",
    		county: "Powhatan County",
    		avgInfected: 32.083333333333336
    	},
    	{
    		state: "VA",
    		county: "Prince Edward County",
    		avgInfected: 69.66666666666667
    	},
    	{
    		state: "VA",
    		county: "Prince George County",
    		avgInfected: 110.66666666666667
    	},
    	{
    		state: "VA",
    		county: "Prince William County",
    		avgInfected: 1369.0833333333333
    	},
    	{
    		state: "VA",
    		county: "Pulaski County",
    		avgInfected: 39.833333333333336
    	},
    	{
    		state: "VA",
    		county: "Rappahannock County",
    		avgInfected: 6.25
    	},
    	{
    		state: "VA",
    		county: "Richmond County",
    		avgInfected: 31.666666666666668
    	},
    	{
    		state: "VA",
    		county: "Roanoke County",
    		avgInfected: 195.33333333333334
    	},
    	{
    		state: "VA",
    		county: "Rockbridge County",
    		avgInfected: 17.833333333333332
    	},
    	{
    		state: "VA",
    		county: "Rockingham County",
    		avgInfected: 168.75
    	},
    	{
    		state: "VA",
    		county: "Russell County",
    		avgInfected: 60.75
    	},
    	{
    		state: "VA",
    		county: "Scott County",
    		avgInfected: 54.916666666666664
    	},
    	{
    		state: "VA",
    		county: "Shenandoah County",
    		avgInfected: 104.25
    	},
    	{
    		state: "VA",
    		county: "Smyth County",
    		avgInfected: 73.91666666666667
    	},
    	{
    		state: "VA",
    		county: "Southampton County",
    		avgInfected: 79.91666666666667
    	},
    	{
    		state: "VA",
    		county: "Spotsylvania County",
    		avgInfected: 235.41666666666666
    	},
    	{
    		state: "VA",
    		county: "Stafford County",
    		avgInfected: 240.91666666666666
    	},
    	{
    		state: "VA",
    		county: "Surry County",
    		avgInfected: 12.833333333333334
    	},
    	{
    		state: "VA",
    		county: "Sussex County",
    		avgInfected: 54.833333333333336
    	},
    	{
    		state: "VA",
    		county: "Tazewell County",
    		avgInfected: 70.5
    	},
    	{
    		state: "VA",
    		county: "Warren County",
    		avgInfected: 61.583333333333336
    	},
    	{
    		state: "VA",
    		county: "Washington County",
    		avgInfected: 126.75
    	},
    	{
    		state: "VA",
    		county: "Westmoreland County",
    		avgInfected: 32.416666666666664
    	},
    	{
    		state: "VA",
    		county: "Wise County",
    		avgInfected: 89.91666666666667
    	},
    	{
    		state: "VA",
    		county: "Wythe County",
    		avgInfected: 42.666666666666664
    	},
    	{
    		state: "VA",
    		county: "York County",
    		avgInfected: 65.25
    	},
    	{
    		state: "VA",
    		county: "Alexandria City",
    		avgInfected: 399.75
    	},
    	{
    		state: "VA",
    		county: "Bristol city",
    		avgInfected: 38.25
    	},
    	{
    		state: "VA",
    		county: "Buena Vista city",
    		avgInfected: 17
    	},
    	{
    		state: "VA",
    		county: "Charlottesville City",
    		avgInfected: 147.41666666666666
    	},
    	{
    		state: "VA",
    		county: "Chesapeake City",
    		avgInfected: 477.4166666666667
    	},
    	{
    		state: "VA",
    		county: "Colonial Heights city",
    		avgInfected: 30.5
    	},
    	{
    		state: "VA",
    		county: "Covington city",
    		avgInfected: 9.166666666666666
    	},
    	{
    		state: "VA",
    		county: "Danville City",
    		avgInfected: 122.41666666666667
    	},
    	{
    		state: "VA",
    		county: "Emporia city",
    		avgInfected: 25.583333333333332
    	},
    	{
    		state: "VA",
    		county: "Fairfax city",
    		avgInfected: 15.916666666666666
    	},
    	{
    		state: "VA",
    		county: "Falls Church city",
    		avgInfected: 7.166666666666667
    	},
    	{
    		state: "VA",
    		county: "Franklin city",
    		avgInfected: 44.166666666666664
    	},
    	{
    		state: "VA",
    		county: "Fredericksburg City",
    		avgInfected: 53.416666666666664
    	},
    	{
    		state: "VA",
    		county: "Galax city",
    		avgInfected: 42.75
    	},
    	{
    		state: "VA",
    		county: "Hampton city",
    		avgInfected: 206.75
    	},
    	{
    		state: "VA",
    		county: "Harrisonburg City",
    		avgInfected: 274.6666666666667
    	},
    	{
    		state: "VA",
    		county: "Hopewell city",
    		avgInfected: 47.25
    	},
    	{
    		state: "VA",
    		county: "Lexington city",
    		avgInfected: 26
    	},
    	{
    		state: "VA",
    		county: "Lynchburg city",
    		avgInfected: 199.58333333333334
    	},
    	{
    		state: "VA",
    		county: "Manassas City",
    		avgInfected: 181.66666666666666
    	},
    	{
    		state: "VA",
    		county: "Manassas Park city",
    		avgInfected: 57.333333333333336
    	},
    	{
    		state: "VA",
    		county: "Martinsville city",
    		avgInfected: 49.583333333333336
    	},
    	{
    		state: "VA",
    		county: "Newport News City",
    		avgInfected: 304.5
    	},
    	{
    		state: "VA",
    		county: "Norfolk City",
    		avgInfected: 509.6666666666667
    	},
    	{
    		state: "VA",
    		county: "Norton city",
    		avgInfected: 5.416666666666667
    	},
    	{
    		state: "VA",
    		county: "Petersburg city",
    		avgInfected: 85.75
    	},
    	{
    		state: "VA",
    		county: "Poquoson city",
    		avgInfected: 10.083333333333334
    	},
    	{
    		state: "VA",
    		county: "Portsmouth City",
    		avgInfected: 253.25
    	},
    	{
    		state: "VA",
    		county: "Radford city",
    		avgInfected: 88.58333333333333
    	},
    	{
    		state: "VA",
    		county: "Richmond City",
    		avgInfected: 513.25
    	},
    	{
    		state: "VA",
    		county: "Roanoke city",
    		avgInfected: 306
    	},
    	{
    		state: "VA",
    		county: "Salem city",
    		avgInfected: 63.75
    	},
    	{
    		state: "VA",
    		county: "Staunton city",
    		avgInfected: 44.833333333333336
    	},
    	{
    		state: "VA",
    		county: "Suffolk City",
    		avgInfected: 213.75
    	},
    	{
    		state: "VA",
    		county: "Virginia Beach City",
    		avgInfected: 801.1666666666666
    	},
    	{
    		state: "VA",
    		county: "Waynesboro city",
    		avgInfected: 41.416666666666664
    	},
    	{
    		state: "VA",
    		county: "Williamsburg City",
    		avgInfected: 22.916666666666668
    	},
    	{
    		state: "VA",
    		county: "Winchester city",
    		avgInfected: 69.33333333333333
    	},
    	{
    		state: "WA",
    		county: "Statewide Unallocated",
    		avgInfected: 36.666666666666664
    	},
    	{
    		state: "WA",
    		county: "Adams County",
    		avgInfected: 100
    	},
    	{
    		state: "WA",
    		county: "Asotin County",
    		avgInfected: 43.833333333333336
    	},
    	{
    		state: "WA",
    		county: "Benton County",
    		avgInfected: 576.4166666666666
    	},
    	{
    		state: "WA",
    		county: "Chelan County",
    		avgInfected: 183
    	},
    	{
    		state: "WA",
    		county: "Clallam County",
    		avgInfected: 29.833333333333332
    	},
    	{
    		state: "WA",
    		county: "Clark County",
    		avgInfected: 563.3333333333334
    	},
    	{
    		state: "WA",
    		county: "Columbia County",
    		avgInfected: 2.1666666666666665
    	},
    	{
    		state: "WA",
    		county: "Cowlitz County",
    		avgInfected: 92.83333333333333
    	},
    	{
    		state: "WA",
    		county: "Douglas County",
    		avgInfected: 107.41666666666667
    	},
    	{
    		state: "WA",
    		county: "Ferry County",
    		avgInfected: 3.75
    	},
    	{
    		state: "WA",
    		county: "Franklin County",
    		avgInfected: 473.5833333333333
    	},
    	{
    		state: "WA",
    		county: "Garfield County",
    		avgInfected: 4.333333333333333
    	},
    	{
    		state: "WA",
    		county: "Grant County",
    		avgInfected: 311.5
    	},
    	{
    		state: "WA",
    		county: "Grays Harbor County",
    		avgInfected: 74.5
    	},
    	{
    		state: "WA",
    		county: "Island County",
    		avgInfected: 43.333333333333336
    	},
    	{
    		state: "WA",
    		county: "Jefferson County",
    		avgInfected: 10.666666666666666
    	},
    	{
    		state: "WA",
    		county: "King County",
    		avgInfected: 3039.25
    	},
    	{
    		state: "WA",
    		county: "Kitsap County",
    		avgInfected: 173
    	},
    	{
    		state: "WA",
    		county: "Kittitas County",
    		avgInfected: 68
    	},
    	{
    		state: "WA",
    		county: "Klickitat County",
    		avgInfected: 19.75
    	},
    	{
    		state: "WA",
    		county: "Lewis County",
    		avgInfected: 81.75
    	},
    	{
    		state: "WA",
    		county: "Lincoln County",
    		avgInfected: 10.5
    	},
    	{
    		state: "WA",
    		county: "Mason County",
    		avgInfected: 53.333333333333336
    	},
    	{
    		state: "WA",
    		county: "Okanogan County",
    		avgInfected: 97.25
    	},
    	{
    		state: "WA",
    		county: "Pacific County",
    		avgInfected: 15.916666666666666
    	},
    	{
    		state: "WA",
    		county: "Pend Oreille County",
    		avgInfected: 15.75
    	},
    	{
    		state: "WA",
    		county: "Pierce County",
    		avgInfected: 1159.3333333333333
    	},
    	{
    		state: "WA",
    		county: "San Juan County",
    		avgInfected: 4.5
    	},
    	{
    		state: "WA",
    		county: "Skagit County",
    		avgInfected: 140.58333333333334
    	},
    	{
    		state: "WA",
    		county: "Skamania County",
    		avgInfected: 7.25
    	},
    	{
    		state: "WA",
    		county: "Snohomish County",
    		avgInfected: 1000.1666666666666
    	},
    	{
    		state: "WA",
    		county: "Spokane County",
    		avgInfected: 1110.9166666666667
    	},
    	{
    		state: "WA",
    		county: "Stevens County",
    		avgInfected: 38.833333333333336
    	},
    	{
    		state: "WA",
    		county: "Thurston County",
    		avgInfected: 203.66666666666666
    	},
    	{
    		state: "WA",
    		county: "Wahkiakum County",
    		avgInfected: 1
    	},
    	{
    		state: "WA",
    		county: "Walla Walla County",
    		avgInfected: 153.75
    	},
    	{
    		state: "WA",
    		county: "Whatcom County",
    		avgInfected: 165.25
    	},
    	{
    		state: "WA",
    		county: "Whitman County",
    		avgInfected: 174.83333333333334
    	},
    	{
    		state: "WA",
    		county: "Yakima County",
    		avgInfected: 1059.1666666666667
    	},
    	{
    		state: "WV",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "WV",
    		county: "Barbour County",
    		avgInfected: 24.833333333333332
    	},
    	{
    		state: "WV",
    		county: "Berkeley County",
    		avgInfected: 203.33333333333334
    	},
    	{
    		state: "WV",
    		county: "Boone County",
    		avgInfected: 46.083333333333336
    	},
    	{
    		state: "WV",
    		county: "Braxton County",
    		avgInfected: 8.166666666666666
    	},
    	{
    		state: "WV",
    		county: "Brooke County",
    		avgInfected: 37.916666666666664
    	},
    	{
    		state: "WV",
    		county: "Cabell County",
    		avgInfected: 195.75
    	},
    	{
    		state: "WV",
    		county: "Calhoun County",
    		avgInfected: 4.083333333333333
    	},
    	{
    		state: "WV",
    		county: "Clay County",
    		avgInfected: 8.333333333333334
    	},
    	{
    		state: "WV",
    		county: "Doddridge County",
    		avgInfected: 7.916666666666667
    	},
    	{
    		state: "WV",
    		county: "Fayette County",
    		avgInfected: 83.08333333333333
    	},
    	{
    		state: "WV",
    		county: "Gilmer County",
    		avgInfected: 15
    	},
    	{
    		state: "WV",
    		county: "Grant County",
    		avgInfected: 22
    	},
    	{
    		state: "WV",
    		county: "Greenbrier County",
    		avgInfected: 28.666666666666668
    	},
    	{
    		state: "WV",
    		county: "Hampshire County",
    		avgInfected: 20.166666666666668
    	},
    	{
    		state: "WV",
    		county: "Hancock County",
    		avgInfected: 38.25
    	},
    	{
    		state: "WV",
    		county: "Hardy County",
    		avgInfected: 14.75
    	},
    	{
    		state: "WV",
    		county: "Harrison County",
    		avgInfected: 81.41666666666667
    	},
    	{
    		state: "WV",
    		county: "Jackson County",
    		avgInfected: 51.666666666666664
    	},
    	{
    		state: "WV",
    		county: "Jefferson County",
    		avgInfected: 88.33333333333333
    	},
    	{
    		state: "WV",
    		county: "Kanawha County",
    		avgInfected: 411.1666666666667
    	},
    	{
    		state: "WV",
    		county: "Lewis County",
    		avgInfected: 17.916666666666668
    	},
    	{
    		state: "WV",
    		county: "Lincoln County",
    		avgInfected: 30.916666666666668
    	},
    	{
    		state: "WV",
    		county: "Logan County",
    		avgInfected: 79.83333333333333
    	},
    	{
    		state: "WV",
    		county: "McDowell County",
    		avgInfected: 44.75
    	},
    	{
    		state: "WV",
    		county: "Marion County",
    		avgInfected: 54.416666666666664
    	},
    	{
    		state: "WV",
    		county: "Marshall County",
    		avgInfected: 75.91666666666667
    	},
    	{
    		state: "WV",
    		county: "Mason County",
    		avgInfected: 24.166666666666668
    	},
    	{
    		state: "WV",
    		county: "Mercer County",
    		avgInfected: 93.75
    	},
    	{
    		state: "WV",
    		county: "Mineral County",
    		avgInfected: 65.08333333333333
    	},
    	{
    		state: "WV",
    		county: "Mingo County",
    		avgInfected: 72.75
    	},
    	{
    		state: "WV",
    		county: "Monongalia County",
    		avgInfected: 242.08333333333334
    	},
    	{
    		state: "WV",
    		county: "Monroe County",
    		avgInfected: 25.833333333333332
    	},
    	{
    		state: "WV",
    		county: "Morgan County",
    		avgInfected: 18.25
    	},
    	{
    		state: "WV",
    		county: "Nicholas County",
    		avgInfected: 23.416666666666668
    	},
    	{
    		state: "WV",
    		county: "Ohio County",
    		avgInfected: 98.5
    	},
    	{
    		state: "WV",
    		county: "Pendleton County",
    		avgInfected: 7.333333333333333
    	},
    	{
    		state: "WV",
    		county: "Pleasants County",
    		avgInfected: 5.416666666666667
    	},
    	{
    		state: "WV",
    		county: "Pocahontas County",
    		avgInfected: 7
    	},
    	{
    		state: "WV",
    		county: "Preston County",
    		avgInfected: 33.75
    	},
    	{
    		state: "WV",
    		county: "Putnam County",
    		avgInfected: 125.33333333333333
    	},
    	{
    		state: "WV",
    		county: "Raleigh County",
    		avgInfected: 108.41666666666667
    	},
    	{
    		state: "WV",
    		county: "Randolph County",
    		avgInfected: 49.333333333333336
    	},
    	{
    		state: "WV",
    		county: "Ritchie County",
    		avgInfected: 8.833333333333334
    	},
    	{
    		state: "WV",
    		county: "Roane County",
    		avgInfected: 11.75
    	},
    	{
    		state: "WV",
    		county: "Summers County",
    		avgInfected: 19.333333333333332
    	},
    	{
    		state: "WV",
    		county: "Taylor County",
    		avgInfected: 19.583333333333332
    	},
    	{
    		state: "WV",
    		county: "Tucker County",
    		avgInfected: 7.583333333333333
    	},
    	{
    		state: "WV",
    		county: "Tyler County",
    		avgInfected: 9.583333333333334
    	},
    	{
    		state: "WV",
    		county: "Upshur County",
    		avgInfected: 33.083333333333336
    	},
    	{
    		state: "WV",
    		county: "Wayne County",
    		avgInfected: 71.91666666666667
    	},
    	{
    		state: "WV",
    		county: "Webster County",
    		avgInfected: 4.25
    	},
    	{
    		state: "WV",
    		county: "Wetzel County",
    		avgInfected: 29.333333333333332
    	},
    	{
    		state: "WV",
    		county: "Wirt County",
    		avgInfected: 6.083333333333333
    	},
    	{
    		state: "WV",
    		county: "Wood County",
    		avgInfected: 153.58333333333334
    	},
    	{
    		state: "WV",
    		county: "Wyoming County",
    		avgInfected: 46.583333333333336
    	},
    	{
    		state: "WI",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "WI",
    		county: "Adams County",
    		avgInfected: 82.08333333333333
    	},
    	{
    		state: "WI",
    		county: "Ashland County",
    		avgInfected: 47.5
    	},
    	{
    		state: "WI",
    		county: "Barron County",
    		avgInfected: 255.83333333333334
    	},
    	{
    		state: "WI",
    		county: "Bayfield County",
    		avgInfected: 50.333333333333336
    	},
    	{
    		state: "WI",
    		county: "Brown County",
    		avgInfected: 1753.9166666666667
    	},
    	{
    		state: "WI",
    		county: "Buffalo County",
    		avgInfected: 54.833333333333336
    	},
    	{
    		state: "WI",
    		county: "Burnett County",
    		avgInfected: 55
    	},
    	{
    		state: "WI",
    		county: "Calumet County",
    		avgInfected: 324.75
    	},
    	{
    		state: "WI",
    		county: "Chippewa County",
    		avgInfected: 327.75
    	},
    	{
    		state: "WI",
    		county: "Clark County",
    		avgInfected: 163.75
    	},
    	{
    		state: "WI",
    		county: "Columbia County",
    		avgInfected: 258.9166666666667
    	},
    	{
    		state: "WI",
    		county: "Crawford County",
    		avgInfected: 63.5
    	},
    	{
    		state: "WI",
    		county: "Dane County",
    		avgInfected: 2043.25
    	},
    	{
    		state: "WI",
    		county: "Dodge County",
    		avgInfected: 644.75
    	},
    	{
    		state: "WI",
    		county: "Door County",
    		avgInfected: 130.5
    	},
    	{
    		state: "WI",
    		county: "Douglas County",
    		avgInfected: 125.41666666666667
    	},
    	{
    		state: "WI",
    		county: "Dunn County",
    		avgInfected: 192.25
    	},
    	{
    		state: "WI",
    		county: "Eau Claire County",
    		avgInfected: 572.4166666666666
    	},
    	{
    		state: "WI",
    		county: "Florence County",
    		avgInfected: 25.666666666666668
    	},
    	{
    		state: "WI",
    		county: "Fond du Lac County",
    		avgInfected: 660.75
    	},
    	{
    		state: "WI",
    		county: "Forest County",
    		avgInfected: 59.916666666666664
    	},
    	{
    		state: "WI",
    		county: "Grant County",
    		avgInfected: 272.8333333333333
    	},
    	{
    		state: "WI",
    		county: "Green County",
    		avgInfected: 125.16666666666667
    	},
    	{
    		state: "WI",
    		county: "Green Lake County",
    		avgInfected: 107.08333333333333
    	},
    	{
    		state: "WI",
    		county: "Iowa County",
    		avgInfected: 95.5
    	},
    	{
    		state: "WI",
    		county: "Iron County",
    		avgInfected: 31.25
    	},
    	{
    		state: "WI",
    		county: "Jackson County",
    		avgInfected: 116.41666666666667
    	},
    	{
    		state: "WI",
    		county: "Jefferson County",
    		avgInfected: 407.5833333333333
    	},
    	{
    		state: "WI",
    		county: "Juneau County",
    		avgInfected: 142.08333333333334
    	},
    	{
    		state: "WI",
    		county: "Kenosha County",
    		avgInfected: 740.5833333333334
    	},
    	{
    		state: "WI",
    		county: "Kewaunee County",
    		avgInfected: 129.25
    	},
    	{
    		state: "WI",
    		county: "La Crosse County",
    		avgInfected: 598.0833333333334
    	},
    	{
    		state: "WI",
    		county: "Lafayette County",
    		avgInfected: 82.33333333333333
    	},
    	{
    		state: "WI",
    		county: "Langlade County",
    		avgInfected: 124
    	},
    	{
    		state: "WI",
    		county: "Lincoln County",
    		avgInfected: 145
    	},
    	{
    		state: "WI",
    		county: "Manitowoc County",
    		avgInfected: 408
    	},
    	{
    		state: "WI",
    		county: "Marathon County",
    		avgInfected: 774
    	},
    	{
    		state: "WI",
    		county: "Marinette County",
    		avgInfected: 236.75
    	},
    	{
    		state: "WI",
    		county: "Marquette County",
    		avgInfected: 89.75
    	},
    	{
    		state: "WI",
    		county: "Menominee County",
    		avgInfected: 44.166666666666664
    	},
    	{
    		state: "WI",
    		county: "Milwaukee County",
    		avgInfected: 5261.75
    	},
    	{
    		state: "WI",
    		county: "Monroe County",
    		avgInfected: 178.83333333333334
    	},
    	{
    		state: "WI",
    		county: "Oconto County",
    		avgInfected: 259.75
    	},
    	{
    		state: "WI",
    		county: "Oneida County",
    		avgInfected: 174.16666666666666
    	},
    	{
    		state: "WI",
    		county: "Outagamie County",
    		avgInfected: 1108.0833333333333
    	},
    	{
    		state: "WI",
    		county: "Ozaukee County",
    		avgInfected: 383.6666666666667
    	},
    	{
    		state: "WI",
    		county: "Pepin County",
    		avgInfected: 34.083333333333336
    	},
    	{
    		state: "WI",
    		county: "Pierce County",
    		avgInfected: 168.25
    	},
    	{
    		state: "WI",
    		county: "Polk County",
    		avgInfected: 144.83333333333334
    	},
    	{
    		state: "WI",
    		county: "Portage County",
    		avgInfected: 365.5833333333333
    	},
    	{
    		state: "WI",
    		county: "Price County",
    		avgInfected: 54.25
    	},
    	{
    		state: "WI",
    		county: "Racine County",
    		avgInfected: 1125.0833333333333
    	},
    	{
    		state: "WI",
    		county: "Richland County",
    		avgInfected: 64.5
    	},
    	{
    		state: "WI",
    		county: "Rock County",
    		avgInfected: 705.6666666666666
    	},
    	{
    		state: "WI",
    		county: "Rusk County",
    		avgInfected: 60.5
    	},
    	{
    		state: "WI",
    		county: "St. Croix County",
    		avgInfected: 323.8333333333333
    	},
    	{
    		state: "WI",
    		county: "Sauk County",
    		avgInfected: 264.25
    	},
    	{
    		state: "WI",
    		county: "Sawyer County",
    		avgInfected: 61.083333333333336
    	},
    	{
    		state: "WI",
    		county: "Shawano County",
    		avgInfected: 295.3333333333333
    	},
    	{
    		state: "WI",
    		county: "Sheboygan County",
    		avgInfected: 691.25
    	},
    	{
    		state: "WI",
    		county: "Taylor County",
    		avgInfected: 88.58333333333333
    	},
    	{
    		state: "WI",
    		county: "Trempealeau County",
    		avgInfected: 168.5
    	},
    	{
    		state: "WI",
    		county: "Vernon County",
    		avgInfected: 77
    	},
    	{
    		state: "WI",
    		county: "Vilas County",
    		avgInfected: 89.83333333333333
    	},
    	{
    		state: "WI",
    		county: "Walworth County",
    		avgInfected: 494.75
    	},
    	{
    		state: "WI",
    		county: "Washburn County",
    		avgInfected: 45.75
    	},
    	{
    		state: "WI",
    		county: "Washington County",
    		avgInfected: 699.3333333333334
    	},
    	{
    		state: "WI",
    		county: "Waukesha County",
    		avgInfected: 2024.8333333333333
    	},
    	{
    		state: "WI",
    		county: "Waupaca County",
    		avgInfected: 318.4166666666667
    	},
    	{
    		state: "WI",
    		county: "Waushara County",
    		avgInfected: 141.66666666666666
    	},
    	{
    		state: "WI",
    		county: "Winnebago County",
    		avgInfected: 1095.8333333333333
    	},
    	{
    		state: "WI",
    		county: "Wood County",
    		avgInfected: 310.5833333333333
    	},
    	{
    		state: "WY",
    		county: "Statewide Unallocated",
    		avgInfected: 0
    	},
    	{
    		state: "WY",
    		county: "Albany County",
    		avgInfected: 228.75
    	},
    	{
    		state: "WY",
    		county: "Big Horn County",
    		avgInfected: 34
    	},
    	{
    		state: "WY",
    		county: "Campbell County",
    		avgInfected: 201.58333333333334
    	},
    	{
    		state: "WY",
    		county: "Carbon County",
    		avgInfected: 43.833333333333336
    	},
    	{
    		state: "WY",
    		county: "Converse County",
    		avgInfected: 44
    	},
    	{
    		state: "WY",
    		county: "Crook County",
    		avgInfected: 22.166666666666668
    	},
    	{
    		state: "WY",
    		county: "Fremont County",
    		avgInfected: 227.83333333333334
    	},
    	{
    		state: "WY",
    		county: "Goshen County",
    		avgInfected: 40.583333333333336
    	},
    	{
    		state: "WY",
    		county: "Hot Springs County",
    		avgInfected: 8.583333333333334
    	},
    	{
    		state: "WY",
    		county: "Johnson County",
    		avgInfected: 19.583333333333332
    	},
    	{
    		state: "WY",
    		county: "Laramie County",
    		avgInfected: 321.25
    	},
    	{
    		state: "WY",
    		county: "Lincoln County",
    		avgInfected: 46.75
    	},
    	{
    		state: "WY",
    		county: "Natrona County",
    		avgInfected: 326.1666666666667
    	},
    	{
    		state: "WY",
    		county: "Niobrara County",
    		avgInfected: 6.916666666666667
    	},
    	{
    		state: "WY",
    		county: "Park County",
    		avgInfected: 94.91666666666667
    	},
    	{
    		state: "WY",
    		county: "Platte County",
    		avgInfected: 23.333333333333332
    	},
    	{
    		state: "WY",
    		county: "Sheridan County",
    		avgInfected: 123.83333333333333
    	},
    	{
    		state: "WY",
    		county: "Sublette County",
    		avgInfected: 27.916666666666668
    	},
    	{
    		state: "WY",
    		county: "Sweetwater County",
    		avgInfected: 105.75
    	},
    	{
    		state: "WY",
    		county: "Teton County",
    		avgInfected: 108.16666666666667
    	},
    	{
    		state: "WY",
    		county: "Uinta County",
    		avgInfected: 72.41666666666667
    	},
    	{
    		state: "WY",
    		county: "Washakie County",
    		avgInfected: 22.833333333333332
    	},
    	{
    		state: "WY",
    		county: "Weston County",
    		avgInfected: 29.583333333333332
    	}
    ];

    var covidPop = [
    	{
    		county: "Statewide Unallocated",
    		state: "AL",
    		pop: 0
    	},
    	{
    		county: "Autauga County",
    		state: "AL",
    		pop: 55869
    	},
    	{
    		county: "Baldwin County",
    		state: "AL",
    		pop: 223234
    	},
    	{
    		county: "Barbour County",
    		state: "AL",
    		pop: 24686
    	},
    	{
    		county: "Bibb County",
    		state: "AL",
    		pop: 22394
    	},
    	{
    		county: "Blount County",
    		state: "AL",
    		pop: 57826
    	},
    	{
    		county: "Bullock County",
    		state: "AL",
    		pop: 10101
    	},
    	{
    		county: "Butler County",
    		state: "AL",
    		pop: 19448
    	},
    	{
    		county: "Calhoun County",
    		state: "AL",
    		pop: 113605
    	},
    	{
    		county: "Chambers County",
    		state: "AL",
    		pop: 33254
    	},
    	{
    		county: "Cherokee County",
    		state: "AL",
    		pop: 26196
    	},
    	{
    		county: "Chilton County",
    		state: "AL",
    		pop: 44428
    	},
    	{
    		county: "Choctaw County",
    		state: "AL",
    		pop: 12589
    	},
    	{
    		county: "Clarke County",
    		state: "AL",
    		pop: 23622
    	},
    	{
    		county: "Clay County",
    		state: "AL",
    		pop: 13235
    	},
    	{
    		county: "Cleburne County",
    		state: "AL",
    		pop: 14910
    	},
    	{
    		county: "Coffee County",
    		state: "AL",
    		pop: 52342
    	},
    	{
    		county: "Colbert County",
    		state: "AL",
    		pop: 55241
    	},
    	{
    		county: "Conecuh County",
    		state: "AL",
    		pop: 12067
    	},
    	{
    		county: "Coosa County",
    		state: "AL",
    		pop: 10663
    	},
    	{
    		county: "Covington County",
    		state: "AL",
    		pop: 37049
    	},
    	{
    		county: "Crenshaw County",
    		state: "AL",
    		pop: 13772
    	},
    	{
    		county: "Cullman County",
    		state: "AL",
    		pop: 83768
    	},
    	{
    		county: "Dale County",
    		state: "AL",
    		pop: 49172
    	},
    	{
    		county: "Dallas County",
    		state: "AL",
    		pop: 37196
    	},
    	{
    		county: "DeKalb County",
    		state: "AL",
    		pop: 71513
    	},
    	{
    		county: "Elmore County",
    		state: "AL",
    		pop: 81209
    	},
    	{
    		county: "Escambia County",
    		state: "AL",
    		pop: 36633
    	},
    	{
    		county: "Etowah County",
    		state: "AL",
    		pop: 102268
    	},
    	{
    		county: "Fayette County",
    		state: "AL",
    		pop: 16302
    	},
    	{
    		county: "Franklin County",
    		state: "AL",
    		pop: 31362
    	},
    	{
    		county: "Geneva County",
    		state: "AL",
    		pop: 26271
    	},
    	{
    		county: "Greene County",
    		state: "AL",
    		pop: 8111
    	},
    	{
    		county: "Hale County",
    		state: "AL",
    		pop: 14651
    	},
    	{
    		county: "Henry County",
    		state: "AL",
    		pop: 17205
    	},
    	{
    		county: "Houston County",
    		state: "AL",
    		pop: 105882
    	},
    	{
    		county: "Jackson County",
    		state: "AL",
    		pop: 51626
    	},
    	{
    		county: "Jefferson County",
    		state: "AL",
    		pop: 658573
    	},
    	{
    		county: "Lamar County",
    		state: "AL",
    		pop: 13805
    	},
    	{
    		county: "Lauderdale County",
    		state: "AL",
    		pop: 92729
    	},
    	{
    		county: "Lawrence County",
    		state: "AL",
    		pop: 32924
    	},
    	{
    		county: "Lee County",
    		state: "AL",
    		pop: 164542
    	},
    	{
    		county: "Limestone County",
    		state: "AL",
    		pop: 98915
    	},
    	{
    		county: "Lowndes County",
    		state: "AL",
    		pop: 9726
    	},
    	{
    		county: "Macon County",
    		state: "AL",
    		pop: 18068
    	},
    	{
    		county: "Madison County",
    		state: "AL",
    		pop: 372909
    	},
    	{
    		county: "Marengo County",
    		state: "AL",
    		pop: 18863
    	},
    	{
    		county: "Marion County",
    		state: "AL",
    		pop: 29709
    	},
    	{
    		county: "Marshall County",
    		state: "AL",
    		pop: 96774
    	},
    	{
    		county: "Mobile County",
    		state: "AL",
    		pop: 413210
    	},
    	{
    		county: "Monroe County",
    		state: "AL",
    		pop: 20733
    	},
    	{
    		county: "Montgomery County",
    		state: "AL",
    		pop: 226486
    	},
    	{
    		county: "Morgan County",
    		state: "AL",
    		pop: 119679
    	},
    	{
    		county: "Perry County",
    		state: "AL",
    		pop: 8923
    	},
    	{
    		county: "Pickens County",
    		state: "AL",
    		pop: 19930
    	},
    	{
    		county: "Pike County",
    		state: "AL",
    		pop: 33114
    	},
    	{
    		county: "Randolph County",
    		state: "AL",
    		pop: 22722
    	},
    	{
    		county: "Russell County",
    		state: "AL",
    		pop: 57961
    	},
    	{
    		county: "St. Clair County",
    		state: "AL",
    		pop: 89512
    	},
    	{
    		county: "Shelby County",
    		state: "AL",
    		pop: 217702
    	},
    	{
    		county: "Sumter County",
    		state: "AL",
    		pop: 12427
    	},
    	{
    		county: "Talladega County",
    		state: "AL",
    		pop: 79978
    	},
    	{
    		county: "Tallapoosa County",
    		state: "AL",
    		pop: 40367
    	},
    	{
    		county: "Tuscaloosa County",
    		state: "AL",
    		pop: 209355
    	},
    	{
    		county: "Walker County",
    		state: "AL",
    		pop: 63521
    	},
    	{
    		county: "Washington County",
    		state: "AL",
    		pop: 16326
    	},
    	{
    		county: "Wilcox County",
    		state: "AL",
    		pop: 10373
    	},
    	{
    		county: "Winston County",
    		state: "AL",
    		pop: 23629
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "AK",
    		pop: 0
    	},
    	{
    		county: "Aleutians East Borough",
    		state: "AK",
    		pop: 3337
    	},
    	{
    		county: "Aleutians West Census Area",
    		state: "AK",
    		pop: 5634
    	},
    	{
    		county: "Municipality of Anchorage",
    		state: "AK",
    		pop: 288000
    	},
    	{
    		county: "Bethel Census Area",
    		state: "AK",
    		pop: 18386
    	},
    	{
    		county: "Bristol Bay Borough",
    		state: "AK",
    		pop: 836
    	},
    	{
    		county: "Denali Borough",
    		state: "AK",
    		pop: 2097
    	},
    	{
    		county: "Dillingham Census Area",
    		state: "AK",
    		pop: 4916
    	},
    	{
    		county: "Fairbanks North Star Borough",
    		state: "AK",
    		pop: 96849
    	},
    	{
    		county: "Haines Borough",
    		state: "AK",
    		pop: 2530
    	},
    	{
    		county: "Hoonah-Angoon Census Area",
    		state: "AK",
    		pop: 2148
    	},
    	{
    		county: "City and Borough of Juneau",
    		state: "AK",
    		pop: 31974
    	},
    	{
    		county: "Kenai Peninsula Borough",
    		state: "AK",
    		pop: 58708
    	},
    	{
    		county: "Ketchikan Gateway Borough",
    		state: "AK",
    		pop: 13901
    	},
    	{
    		county: "Kodiak Island Borough",
    		state: "AK",
    		pop: 12998
    	},
    	{
    		county: "Kusilvak Census Area",
    		state: "AK",
    		pop: 8314
    	},
    	{
    		county: "Lake and Peninsula Borough",
    		state: "AK",
    		pop: 1592
    	},
    	{
    		county: "Matanuska-Susitna Borough",
    		state: "AK",
    		pop: 108317
    	},
    	{
    		county: "Nome Census Area",
    		state: "AK",
    		pop: 10004
    	},
    	{
    		county: "North Slope Borough",
    		state: "AK",
    		pop: 9832
    	},
    	{
    		county: "Northwest Arctic Borough",
    		state: "AK",
    		pop: 7621
    	},
    	{
    		county: "Petersburg Census Area",
    		state: "AK",
    		pop: 3266
    	},
    	{
    		county: "Prince of Wales-Hyder Census Area",
    		state: "AK",
    		pop: 6203
    	},
    	{
    		county: "Sitka City and Borough",
    		state: "AK",
    		pop: 8493
    	},
    	{
    		county: "Skagway Municipality",
    		state: "AK",
    		pop: 1183
    	},
    	{
    		county: "Southeast Fairbanks Census Area",
    		state: "AK",
    		pop: 6893
    	},
    	{
    		county: "Valdez-Cordova Census Area",
    		state: "AK",
    		pop: 9202
    	},
    	{
    		county: "Wade Hampton Census Area",
    		state: "AK",
    		pop: 0
    	},
    	{
    		county: "Wrangell City and Borough",
    		state: "AK",
    		pop: 2502
    	},
    	{
    		county: "Yakutat City and Borough",
    		state: "AK",
    		pop: 579
    	},
    	{
    		county: "Yukon-Koyukuk Census Area",
    		state: "AK",
    		pop: 5230
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "AZ",
    		pop: 0
    	},
    	{
    		county: "Apache County",
    		state: "AZ",
    		pop: 71887
    	},
    	{
    		county: "Cochise County",
    		state: "AZ",
    		pop: 125922
    	},
    	{
    		county: "Coconino County",
    		state: "AZ",
    		pop: 143476
    	},
    	{
    		county: "Gila County",
    		state: "AZ",
    		pop: 54018
    	},
    	{
    		county: "Graham County",
    		state: "AZ",
    		pop: 38837
    	},
    	{
    		county: "Greenlee County",
    		state: "AZ",
    		pop: 9498
    	},
    	{
    		county: "La Paz County",
    		state: "AZ",
    		pop: 21108
    	},
    	{
    		county: "Maricopa County",
    		state: "AZ",
    		pop: 4485414
    	},
    	{
    		county: "Mohave County",
    		state: "AZ",
    		pop: 212181
    	},
    	{
    		county: "Navajo County",
    		state: "AZ",
    		pop: 110924
    	},
    	{
    		county: "Pima County",
    		state: "AZ",
    		pop: 1047279
    	},
    	{
    		county: "Pinal County",
    		state: "AZ",
    		pop: 462789
    	},
    	{
    		county: "Santa Cruz County",
    		state: "AZ",
    		pop: 46498
    	},
    	{
    		county: "Yavapai County",
    		state: "AZ",
    		pop: 235099
    	},
    	{
    		county: "Yuma County",
    		state: "AZ",
    		pop: 213787
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "AR",
    		pop: 0
    	},
    	{
    		county: "Arkansas County",
    		state: "AR",
    		pop: 17486
    	},
    	{
    		county: "Ashley County",
    		state: "AR",
    		pop: 19657
    	},
    	{
    		county: "Baxter County",
    		state: "AR",
    		pop: 41932
    	},
    	{
    		county: "Benton County",
    		state: "AR",
    		pop: 279141
    	},
    	{
    		county: "Boone County",
    		state: "AR",
    		pop: 37432
    	},
    	{
    		county: "Bradley County",
    		state: "AR",
    		pop: 10763
    	},
    	{
    		county: "Calhoun County",
    		state: "AR",
    		pop: 5189
    	},
    	{
    		county: "Carroll County",
    		state: "AR",
    		pop: 28380
    	},
    	{
    		county: "Chicot County",
    		state: "AR",
    		pop: 10118
    	},
    	{
    		county: "Clark County",
    		state: "AR",
    		pop: 22320
    	},
    	{
    		county: "Clay County",
    		state: "AR",
    		pop: 14551
    	},
    	{
    		county: "Cleburne County",
    		state: "AR",
    		pop: 24919
    	},
    	{
    		county: "Cleveland County",
    		state: "AR",
    		pop: 7956
    	},
    	{
    		county: "Columbia County",
    		state: "AR",
    		pop: 23457
    	},
    	{
    		county: "Conway County",
    		state: "AR",
    		pop: 20846
    	},
    	{
    		county: "Craighead County",
    		state: "AR",
    		pop: 110332
    	},
    	{
    		county: "Crawford County",
    		state: "AR",
    		pop: 63257
    	},
    	{
    		county: "Crittenden County",
    		state: "AR",
    		pop: 47955
    	},
    	{
    		county: "Cross County",
    		state: "AR",
    		pop: 16419
    	},
    	{
    		county: "Dallas County",
    		state: "AR",
    		pop: 7009
    	},
    	{
    		county: "Desha County",
    		state: "AR",
    		pop: 11361
    	},
    	{
    		county: "Drew County",
    		state: "AR",
    		pop: 18219
    	},
    	{
    		county: "Faulkner County",
    		state: "AR",
    		pop: 126007
    	},
    	{
    		county: "Franklin County",
    		state: "AR",
    		pop: 17715
    	},
    	{
    		county: "Fulton County",
    		state: "AR",
    		pop: 12477
    	},
    	{
    		county: "Garland County",
    		state: "AR",
    		pop: 99386
    	},
    	{
    		county: "Grant County",
    		state: "AR",
    		pop: 18265
    	},
    	{
    		county: "Greene County",
    		state: "AR",
    		pop: 45325
    	},
    	{
    		county: "Hempstead County",
    		state: "AR",
    		pop: 21532
    	},
    	{
    		county: "Hot Spring County",
    		state: "AR",
    		pop: 33771
    	},
    	{
    		county: "Howard County",
    		state: "AR",
    		pop: 13202
    	},
    	{
    		county: "Independence County",
    		state: "AR",
    		pop: 37825
    	},
    	{
    		county: "Izard County",
    		state: "AR",
    		pop: 13629
    	},
    	{
    		county: "Jackson County",
    		state: "AR",
    		pop: 16719
    	},
    	{
    		county: "Jefferson County",
    		state: "AR",
    		pop: 66824
    	},
    	{
    		county: "Johnson County",
    		state: "AR",
    		pop: 26578
    	},
    	{
    		county: "Lafayette County",
    		state: "AR",
    		pop: 6624
    	},
    	{
    		county: "Lawrence County",
    		state: "AR",
    		pop: 16406
    	},
    	{
    		county: "Lee County",
    		state: "AR",
    		pop: 8857
    	},
    	{
    		county: "Lincoln County",
    		state: "AR",
    		pop: 13024
    	},
    	{
    		county: "Little River County",
    		state: "AR",
    		pop: 12259
    	},
    	{
    		county: "Logan County",
    		state: "AR",
    		pop: 21466
    	},
    	{
    		county: "Lonoke County",
    		state: "AR",
    		pop: 73309
    	},
    	{
    		county: "Madison County",
    		state: "AR",
    		pop: 16576
    	},
    	{
    		county: "Marion County",
    		state: "AR",
    		pop: 16694
    	},
    	{
    		county: "Miller County",
    		state: "AR",
    		pop: 43257
    	},
    	{
    		county: "Mississippi County",
    		state: "AR",
    		pop: 40651
    	},
    	{
    		county: "Monroe County",
    		state: "AR",
    		pop: 6701
    	},
    	{
    		county: "Montgomery County",
    		state: "AR",
    		pop: 8986
    	},
    	{
    		county: "Nevada County",
    		state: "AR",
    		pop: 8252
    	},
    	{
    		county: "Newton County",
    		state: "AR",
    		pop: 7753
    	},
    	{
    		county: "Ouachita County",
    		state: "AR",
    		pop: 23382
    	},
    	{
    		county: "Perry County",
    		state: "AR",
    		pop: 10455
    	},
    	{
    		county: "Phillips County",
    		state: "AR",
    		pop: 17782
    	},
    	{
    		county: "Pike County",
    		state: "AR",
    		pop: 10718
    	},
    	{
    		county: "Poinsett County",
    		state: "AR",
    		pop: 23528
    	},
    	{
    		county: "Polk County",
    		state: "AR",
    		pop: 19964
    	},
    	{
    		county: "Pope County",
    		state: "AR",
    		pop: 64072
    	},
    	{
    		county: "Prairie County",
    		state: "AR",
    		pop: 8062
    	},
    	{
    		county: "Pulaski County",
    		state: "AR",
    		pop: 391911
    	},
    	{
    		county: "Randolph County",
    		state: "AR",
    		pop: 17958
    	},
    	{
    		county: "St. Francis County",
    		state: "AR",
    		pop: 24994
    	},
    	{
    		county: "Saline County",
    		state: "AR",
    		pop: 122437
    	},
    	{
    		county: "Scott County",
    		state: "AR",
    		pop: 10281
    	},
    	{
    		county: "Searcy County",
    		state: "AR",
    		pop: 7881
    	},
    	{
    		county: "Sebastian County",
    		state: "AR",
    		pop: 127827
    	},
    	{
    		county: "Sevier County",
    		state: "AR",
    		pop: 17007
    	},
    	{
    		county: "Sharp County",
    		state: "AR",
    		pop: 17442
    	},
    	{
    		county: "Stone County",
    		state: "AR",
    		pop: 12506
    	},
    	{
    		county: "Union County",
    		state: "AR",
    		pop: 38682
    	},
    	{
    		county: "Van Buren County",
    		state: "AR",
    		pop: 16545
    	},
    	{
    		county: "Washington County",
    		state: "AR",
    		pop: 239187
    	},
    	{
    		county: "White County",
    		state: "AR",
    		pop: 78753
    	},
    	{
    		county: "Woodruff County",
    		state: "AR",
    		pop: 6320
    	},
    	{
    		county: "Yell County",
    		state: "AR",
    		pop: 21341
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "CA",
    		pop: 0
    	},
    	{
    		county: "Grand Princess Cruise Ship",
    		state: "CA",
    		pop: 0
    	},
    	{
    		county: "Alameda County",
    		state: "CA",
    		pop: 1671329
    	},
    	{
    		county: "Alpine County",
    		state: "CA",
    		pop: 1129
    	},
    	{
    		county: "Amador County",
    		state: "CA",
    		pop: 39752
    	},
    	{
    		county: "Butte County",
    		state: "CA",
    		pop: 219186
    	},
    	{
    		county: "Calaveras County",
    		state: "CA",
    		pop: 45905
    	},
    	{
    		county: "Colusa County",
    		state: "CA",
    		pop: 21547
    	},
    	{
    		county: "Contra Costa County",
    		state: "CA",
    		pop: 1153526
    	},
    	{
    		county: "Del Norte County",
    		state: "CA",
    		pop: 27812
    	},
    	{
    		county: "El Dorado County",
    		state: "CA",
    		pop: 192843
    	},
    	{
    		county: "Fresno County",
    		state: "CA",
    		pop: 999101
    	},
    	{
    		county: "Glenn County",
    		state: "CA",
    		pop: 28393
    	},
    	{
    		county: "Humboldt County",
    		state: "CA",
    		pop: 135558
    	},
    	{
    		county: "Imperial County",
    		state: "CA",
    		pop: 181215
    	},
    	{
    		county: "Inyo County",
    		state: "CA",
    		pop: 18039
    	},
    	{
    		county: "Kern County",
    		state: "CA",
    		pop: 900202
    	},
    	{
    		county: "Kings County",
    		state: "CA",
    		pop: 152940
    	},
    	{
    		county: "Lake County",
    		state: "CA",
    		pop: 64386
    	},
    	{
    		county: "Lassen County",
    		state: "CA",
    		pop: 30573
    	},
    	{
    		county: "Los Angeles County",
    		state: "CA",
    		pop: 10039107
    	},
    	{
    		county: "Madera County",
    		state: "CA",
    		pop: 157327
    	},
    	{
    		county: "Marin County",
    		state: "CA",
    		pop: 258826
    	},
    	{
    		county: "Mariposa County",
    		state: "CA",
    		pop: 17203
    	},
    	{
    		county: "Mendocino County",
    		state: "CA",
    		pop: 86749
    	},
    	{
    		county: "Merced County",
    		state: "CA",
    		pop: 277680
    	},
    	{
    		county: "Modoc County",
    		state: "CA",
    		pop: 8841
    	},
    	{
    		county: "Mono County",
    		state: "CA",
    		pop: 14444
    	},
    	{
    		county: "Monterey County",
    		state: "CA",
    		pop: 434061
    	},
    	{
    		county: "Napa County",
    		state: "CA",
    		pop: 137744
    	},
    	{
    		county: "Nevada County",
    		state: "CA",
    		pop: 99755
    	},
    	{
    		county: "Orange County",
    		state: "CA",
    		pop: 3175692
    	},
    	{
    		county: "Placer County",
    		state: "CA",
    		pop: 398329
    	},
    	{
    		county: "Plumas County",
    		state: "CA",
    		pop: 18807
    	},
    	{
    		county: "Riverside County",
    		state: "CA",
    		pop: 2470546
    	},
    	{
    		county: "Sacramento County",
    		state: "CA",
    		pop: 1552058
    	},
    	{
    		county: "San Benito County",
    		state: "CA",
    		pop: 62808
    	},
    	{
    		county: "San Bernardino County",
    		state: "CA",
    		pop: 2180085
    	},
    	{
    		county: "San Diego County",
    		state: "CA",
    		pop: 3338330
    	},
    	{
    		county: "San Francisco County",
    		state: "CA",
    		pop: 881549
    	},
    	{
    		county: "San Joaquin County",
    		state: "CA",
    		pop: 762148
    	},
    	{
    		county: "San Luis Obispo County",
    		state: "CA",
    		pop: 283111
    	},
    	{
    		county: "San Mateo County",
    		state: "CA",
    		pop: 766573
    	},
    	{
    		county: "Santa Barbara County",
    		state: "CA",
    		pop: 446499
    	},
    	{
    		county: "Santa Clara County",
    		state: "CA",
    		pop: 1927852
    	},
    	{
    		county: "Santa Cruz County",
    		state: "CA",
    		pop: 273213
    	},
    	{
    		county: "Shasta County",
    		state: "CA",
    		pop: 180080
    	},
    	{
    		county: "Sierra County",
    		state: "CA",
    		pop: 3005
    	},
    	{
    		county: "Siskiyou County",
    		state: "CA",
    		pop: 43539
    	},
    	{
    		county: "Solano County",
    		state: "CA",
    		pop: 447643
    	},
    	{
    		county: "Sonoma County",
    		state: "CA",
    		pop: 494336
    	},
    	{
    		county: "Stanislaus County",
    		state: "CA",
    		pop: 550660
    	},
    	{
    		county: "Sutter County",
    		state: "CA",
    		pop: 96971
    	},
    	{
    		county: "Tehama County",
    		state: "CA",
    		pop: 65084
    	},
    	{
    		county: "Trinity County",
    		state: "CA",
    		pop: 12285
    	},
    	{
    		county: "Tulare County",
    		state: "CA",
    		pop: 466195
    	},
    	{
    		county: "Tuolumne County",
    		state: "CA",
    		pop: 54478
    	},
    	{
    		county: "Ventura County",
    		state: "CA",
    		pop: 846006
    	},
    	{
    		county: "Yolo County",
    		state: "CA",
    		pop: 220500
    	},
    	{
    		county: "Yuba County",
    		state: "CA",
    		pop: 78668
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "CO",
    		pop: 0
    	},
    	{
    		county: "Adams County",
    		state: "CO",
    		pop: 517421
    	},
    	{
    		county: "Alamosa County",
    		state: "CO",
    		pop: 16233
    	},
    	{
    		county: "Arapahoe County",
    		state: "CO",
    		pop: 656590
    	},
    	{
    		county: "Archuleta County",
    		state: "CO",
    		pop: 14029
    	},
    	{
    		county: "Baca County",
    		state: "CO",
    		pop: 3581
    	},
    	{
    		county: "Bent County",
    		state: "CO",
    		pop: 5577
    	},
    	{
    		county: "Boulder County",
    		state: "CO",
    		pop: 326196
    	},
    	{
    		county: "Broomfield County and City",
    		state: "CO",
    		pop: 70465
    	},
    	{
    		county: "Chaffee County",
    		state: "CO",
    		pop: 20356
    	},
    	{
    		county: "Cheyenne County",
    		state: "CO",
    		pop: 1831
    	},
    	{
    		county: "Clear Creek County",
    		state: "CO",
    		pop: 9700
    	},
    	{
    		county: "Conejos County",
    		state: "CO",
    		pop: 8205
    	},
    	{
    		county: "Costilla County",
    		state: "CO",
    		pop: 3887
    	},
    	{
    		county: "Crowley County",
    		state: "CO",
    		pop: 6061
    	},
    	{
    		county: "Custer County",
    		state: "CO",
    		pop: 5068
    	},
    	{
    		county: "Delta County",
    		state: "CO",
    		pop: 31162
    	},
    	{
    		county: "Denver County",
    		state: "CO",
    		pop: 727211
    	},
    	{
    		county: "Dolores County",
    		state: "CO",
    		pop: 2055
    	},
    	{
    		county: "Douglas County",
    		state: "CO",
    		pop: 351154
    	},
    	{
    		county: "Eagle County",
    		state: "CO",
    		pop: 55127
    	},
    	{
    		county: "Elbert County",
    		state: "CO",
    		pop: 26729
    	},
    	{
    		county: "El Paso County",
    		state: "CO",
    		pop: 720403
    	},
    	{
    		county: "Fremont County",
    		state: "CO",
    		pop: 47839
    	},
    	{
    		county: "Garfield County",
    		state: "CO",
    		pop: 60061
    	},
    	{
    		county: "Gilpin County",
    		state: "CO",
    		pop: 6243
    	},
    	{
    		county: "Grand County",
    		state: "CO",
    		pop: 15734
    	},
    	{
    		county: "Gunnison County",
    		state: "CO",
    		pop: 17462
    	},
    	{
    		county: "Hinsdale County",
    		state: "CO",
    		pop: 820
    	},
    	{
    		county: "Huerfano County",
    		state: "CO",
    		pop: 6897
    	},
    	{
    		county: "Jackson County",
    		state: "CO",
    		pop: 1392
    	},
    	{
    		county: "Jefferson County",
    		state: "CO",
    		pop: 582881
    	},
    	{
    		county: "Kiowa County",
    		state: "CO",
    		pop: 1406
    	},
    	{
    		county: "Kit Carson County",
    		state: "CO",
    		pop: 7097
    	},
    	{
    		county: "Lake County",
    		state: "CO",
    		pop: 8127
    	},
    	{
    		county: "La Plata County",
    		state: "CO",
    		pop: 56221
    	},
    	{
    		county: "Larimer County",
    		state: "CO",
    		pop: 356899
    	},
    	{
    		county: "Las Animas County",
    		state: "CO",
    		pop: 14506
    	},
    	{
    		county: "Lincoln County",
    		state: "CO",
    		pop: 5701
    	},
    	{
    		county: "Logan County",
    		state: "CO",
    		pop: 22409
    	},
    	{
    		county: "Mesa County",
    		state: "CO",
    		pop: 154210
    	},
    	{
    		county: "Mineral County",
    		state: "CO",
    		pop: 769
    	},
    	{
    		county: "Moffat County",
    		state: "CO",
    		pop: 13283
    	},
    	{
    		county: "Montezuma County",
    		state: "CO",
    		pop: 26183
    	},
    	{
    		county: "Montrose County",
    		state: "CO",
    		pop: 42758
    	},
    	{
    		county: "Morgan County",
    		state: "CO",
    		pop: 29068
    	},
    	{
    		county: "Otero County",
    		state: "CO",
    		pop: 18278
    	},
    	{
    		county: "Ouray County",
    		state: "CO",
    		pop: 4952
    	},
    	{
    		county: "Park County",
    		state: "CO",
    		pop: 18845
    	},
    	{
    		county: "Phillips County",
    		state: "CO",
    		pop: 4265
    	},
    	{
    		county: "Pitkin County",
    		state: "CO",
    		pop: 17767
    	},
    	{
    		county: "Prowers County",
    		state: "CO",
    		pop: 12172
    	},
    	{
    		county: "Pueblo County",
    		state: "CO",
    		pop: 168424
    	},
    	{
    		county: "Rio Blanco County",
    		state: "CO",
    		pop: 6324
    	},
    	{
    		county: "Rio Grande County",
    		state: "CO",
    		pop: 11267
    	},
    	{
    		county: "Routt County",
    		state: "CO",
    		pop: 25638
    	},
    	{
    		county: "Saguache County",
    		state: "CO",
    		pop: 6824
    	},
    	{
    		county: "San Juan County",
    		state: "CO",
    		pop: 728
    	},
    	{
    		county: "San Miguel County",
    		state: "CO",
    		pop: 8179
    	},
    	{
    		county: "Sedgwick County",
    		state: "CO",
    		pop: 2248
    	},
    	{
    		county: "Summit County",
    		state: "CO",
    		pop: 31011
    	},
    	{
    		county: "Teller County",
    		state: "CO",
    		pop: 25388
    	},
    	{
    		county: "Washington County",
    		state: "CO",
    		pop: 4908
    	},
    	{
    		county: "Weld County",
    		state: "CO",
    		pop: 324492
    	},
    	{
    		county: "Yuma County",
    		state: "CO",
    		pop: 10019
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "CT",
    		pop: 0
    	},
    	{
    		county: "Fairfield County",
    		state: "CT",
    		pop: 943332
    	},
    	{
    		county: "Hartford County",
    		state: "CT",
    		pop: 891720
    	},
    	{
    		county: "Litchfield County",
    		state: "CT",
    		pop: 180333
    	},
    	{
    		county: "Middlesex County",
    		state: "CT",
    		pop: 162436
    	},
    	{
    		county: "New Haven County",
    		state: "CT",
    		pop: 854757
    	},
    	{
    		county: "New London County",
    		state: "CT",
    		pop: 265206
    	},
    	{
    		county: "Tolland County",
    		state: "CT",
    		pop: 150721
    	},
    	{
    		county: "Windham County",
    		state: "CT",
    		pop: 116782
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "DE",
    		pop: 0
    	},
    	{
    		county: "Kent County",
    		state: "DE",
    		pop: 180786
    	},
    	{
    		county: "New Castle County",
    		state: "DE",
    		pop: 558753
    	},
    	{
    		county: "Sussex County",
    		state: "DE",
    		pop: 234225
    	},
    	{
    		county: "Washington",
    		state: "DC",
    		pop: 705749
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "FL",
    		pop: 0
    	},
    	{
    		county: "Alachua County",
    		state: "FL",
    		pop: 269043
    	},
    	{
    		county: "Baker County",
    		state: "FL",
    		pop: 29210
    	},
    	{
    		county: "Bay County",
    		state: "FL",
    		pop: 174705
    	},
    	{
    		county: "Bradford County",
    		state: "FL",
    		pop: 28201
    	},
    	{
    		county: "Brevard County",
    		state: "FL",
    		pop: 601942
    	},
    	{
    		county: "Broward County",
    		state: "FL",
    		pop: 1952778
    	},
    	{
    		county: "Calhoun County",
    		state: "FL",
    		pop: 14105
    	},
    	{
    		county: "Charlotte County",
    		state: "FL",
    		pop: 188910
    	},
    	{
    		county: "Citrus County",
    		state: "FL",
    		pop: 149657
    	},
    	{
    		county: "Clay County",
    		state: "FL",
    		pop: 219252
    	},
    	{
    		county: "Collier County",
    		state: "FL",
    		pop: 384902
    	},
    	{
    		county: "Columbia County",
    		state: "FL",
    		pop: 71686
    	},
    	{
    		county: "DeSoto County",
    		state: "FL",
    		pop: 38001
    	},
    	{
    		county: "Dixie County",
    		state: "FL",
    		pop: 16826
    	},
    	{
    		county: "Duval County",
    		state: "FL",
    		pop: 957755
    	},
    	{
    		county: "Escambia County",
    		state: "FL",
    		pop: 318316
    	},
    	{
    		county: "Flagler County",
    		state: "FL",
    		pop: 115081
    	},
    	{
    		county: "Franklin County",
    		state: "FL",
    		pop: 12125
    	},
    	{
    		county: "Gadsden County",
    		state: "FL",
    		pop: 45660
    	},
    	{
    		county: "Gilchrist County",
    		state: "FL",
    		pop: 18582
    	},
    	{
    		county: "Glades County",
    		state: "FL",
    		pop: 13811
    	},
    	{
    		county: "Gulf County",
    		state: "FL",
    		pop: 13639
    	},
    	{
    		county: "Hamilton County",
    		state: "FL",
    		pop: 14428
    	},
    	{
    		county: "Hardee County",
    		state: "FL",
    		pop: 26937
    	},
    	{
    		county: "Hendry County",
    		state: "FL",
    		pop: 42022
    	},
    	{
    		county: "Hernando County",
    		state: "FL",
    		pop: 193920
    	},
    	{
    		county: "Highlands County",
    		state: "FL",
    		pop: 106221
    	},
    	{
    		county: "Hillsborough County",
    		state: "FL",
    		pop: 1471968
    	},
    	{
    		county: "Holmes County",
    		state: "FL",
    		pop: 19617
    	},
    	{
    		county: "Indian River County",
    		state: "FL",
    		pop: 159923
    	},
    	{
    		county: "Jackson County",
    		state: "FL",
    		pop: 46414
    	},
    	{
    		county: "Jefferson County",
    		state: "FL",
    		pop: 14246
    	},
    	{
    		county: "Lafayette County",
    		state: "FL",
    		pop: 8422
    	},
    	{
    		county: "Lake County",
    		state: "FL",
    		pop: 367118
    	},
    	{
    		county: "Lee County",
    		state: "FL",
    		pop: 770577
    	},
    	{
    		county: "Leon County",
    		state: "FL",
    		pop: 293582
    	},
    	{
    		county: "Levy County",
    		state: "FL",
    		pop: 41503
    	},
    	{
    		county: "Liberty County",
    		state: "FL",
    		pop: 8354
    	},
    	{
    		county: "Madison County",
    		state: "FL",
    		pop: 18493
    	},
    	{
    		county: "Manatee County",
    		state: "FL",
    		pop: 403253
    	},
    	{
    		county: "Marion County",
    		state: "FL",
    		pop: 365579
    	},
    	{
    		county: "Martin County",
    		state: "FL",
    		pop: 161000
    	},
    	{
    		county: "Miami-Dade County",
    		state: "FL",
    		pop: 2716940
    	},
    	{
    		county: "Monroe County",
    		state: "FL",
    		pop: 74228
    	},
    	{
    		county: "Nassau County",
    		state: "FL",
    		pop: 88625
    	},
    	{
    		county: "Okaloosa County",
    		state: "FL",
    		pop: 210738
    	},
    	{
    		county: "Okeechobee County",
    		state: "FL",
    		pop: 42168
    	},
    	{
    		county: "Orange County",
    		state: "FL",
    		pop: 1393452
    	},
    	{
    		county: "Osceola County",
    		state: "FL",
    		pop: 375751
    	},
    	{
    		county: "Palm Beach County",
    		state: "FL",
    		pop: 1496770
    	},
    	{
    		county: "Pasco County",
    		state: "FL",
    		pop: 553947
    	},
    	{
    		county: "Pinellas County",
    		state: "FL",
    		pop: 974996
    	},
    	{
    		county: "Polk County",
    		state: "FL",
    		pop: 724777
    	},
    	{
    		county: "Putnam County",
    		state: "FL",
    		pop: 74521
    	},
    	{
    		county: "St. Johns County",
    		state: "FL",
    		pop: 264672
    	},
    	{
    		county: "St. Lucie County",
    		state: "FL",
    		pop: 328297
    	},
    	{
    		county: "Santa Rosa County",
    		state: "FL",
    		pop: 184313
    	},
    	{
    		county: "Sarasota County",
    		state: "FL",
    		pop: 433742
    	},
    	{
    		county: "Seminole County",
    		state: "FL",
    		pop: 471826
    	},
    	{
    		county: "Sumter County",
    		state: "FL",
    		pop: 132420
    	},
    	{
    		county: "Suwannee County",
    		state: "FL",
    		pop: 44417
    	},
    	{
    		county: "Taylor County",
    		state: "FL",
    		pop: 21569
    	},
    	{
    		county: "Union County",
    		state: "FL",
    		pop: 15237
    	},
    	{
    		county: "Volusia County",
    		state: "FL",
    		pop: 553284
    	},
    	{
    		county: "Wakulla County",
    		state: "FL",
    		pop: 33739
    	},
    	{
    		county: "Walton County",
    		state: "FL",
    		pop: 74071
    	},
    	{
    		county: "Washington County",
    		state: "FL",
    		pop: 25473
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "GA",
    		pop: 0
    	},
    	{
    		county: "Appling County",
    		state: "GA",
    		pop: 18386
    	},
    	{
    		county: "Atkinson County",
    		state: "GA",
    		pop: 8165
    	},
    	{
    		county: "Bacon County",
    		state: "GA",
    		pop: 11164
    	},
    	{
    		county: "Baker County",
    		state: "GA",
    		pop: 3038
    	},
    	{
    		county: "Baldwin County",
    		state: "GA",
    		pop: 44890
    	},
    	{
    		county: "Banks County",
    		state: "GA",
    		pop: 19234
    	},
    	{
    		county: "Barrow County",
    		state: "GA",
    		pop: 83240
    	},
    	{
    		county: "Bartow County",
    		state: "GA",
    		pop: 107738
    	},
    	{
    		county: "Ben Hill County",
    		state: "GA",
    		pop: 16700
    	},
    	{
    		county: "Berrien County",
    		state: "GA",
    		pop: 19397
    	},
    	{
    		county: "Bibb County",
    		state: "GA",
    		pop: 153159
    	},
    	{
    		county: "Bleckley County",
    		state: "GA",
    		pop: 12873
    	},
    	{
    		county: "Brantley County",
    		state: "GA",
    		pop: 19109
    	},
    	{
    		county: "Brooks County",
    		state: "GA",
    		pop: 15457
    	},
    	{
    		county: "Bryan County",
    		state: "GA",
    		pop: 39627
    	},
    	{
    		county: "Bulloch County",
    		state: "GA",
    		pop: 79608
    	},
    	{
    		county: "Burke County",
    		state: "GA",
    		pop: 22383
    	},
    	{
    		county: "Butts County",
    		state: "GA",
    		pop: 24936
    	},
    	{
    		county: "Calhoun County",
    		state: "GA",
    		pop: 6189
    	},
    	{
    		county: "Camden County",
    		state: "GA",
    		pop: 54666
    	},
    	{
    		county: "Candler County",
    		state: "GA",
    		pop: 10803
    	},
    	{
    		county: "Carroll County",
    		state: "GA",
    		pop: 119992
    	},
    	{
    		county: "Catoosa County",
    		state: "GA",
    		pop: 67580
    	},
    	{
    		county: "Charlton County",
    		state: "GA",
    		pop: 13392
    	},
    	{
    		county: "Chatham County",
    		state: "GA",
    		pop: 289430
    	},
    	{
    		county: "Chattahoochee County",
    		state: "GA",
    		pop: 10907
    	},
    	{
    		county: "Chattooga County",
    		state: "GA",
    		pop: 24789
    	},
    	{
    		county: "Cherokee County",
    		state: "GA",
    		pop: 258773
    	},
    	{
    		county: "Clarke County",
    		state: "GA",
    		pop: 128331
    	},
    	{
    		county: "Clay County",
    		state: "GA",
    		pop: 2834
    	},
    	{
    		county: "Clayton County",
    		state: "GA",
    		pop: 292256
    	},
    	{
    		county: "Clinch County",
    		state: "GA",
    		pop: 6618
    	},
    	{
    		county: "Cobb County",
    		state: "GA",
    		pop: 760141
    	},
    	{
    		county: "Coffee County",
    		state: "GA",
    		pop: 43273
    	},
    	{
    		county: "Colquitt County",
    		state: "GA",
    		pop: 45600
    	},
    	{
    		county: "Columbia County",
    		state: "GA",
    		pop: 156714
    	},
    	{
    		county: "Cook County",
    		state: "GA",
    		pop: 17270
    	},
    	{
    		county: "Coweta County",
    		state: "GA",
    		pop: 148509
    	},
    	{
    		county: "Crawford County",
    		state: "GA",
    		pop: 12404
    	},
    	{
    		county: "Crisp County",
    		state: "GA",
    		pop: 22372
    	},
    	{
    		county: "Dade County",
    		state: "GA",
    		pop: 16116
    	},
    	{
    		county: "Dawson County",
    		state: "GA",
    		pop: 26108
    	},
    	{
    		county: "Decatur County",
    		state: "GA",
    		pop: 26404
    	},
    	{
    		county: "DeKalb County",
    		state: "GA",
    		pop: 759297
    	},
    	{
    		county: "Dodge County",
    		state: "GA",
    		pop: 20605
    	},
    	{
    		county: "Dooly County",
    		state: "GA",
    		pop: 13390
    	},
    	{
    		county: "Dougherty County",
    		state: "GA",
    		pop: 87956
    	},
    	{
    		county: "Douglas County",
    		state: "GA",
    		pop: 146343
    	},
    	{
    		county: "Early County",
    		state: "GA",
    		pop: 10190
    	},
    	{
    		county: "Echols County",
    		state: "GA",
    		pop: 4006
    	},
    	{
    		county: "Effingham County",
    		state: "GA",
    		pop: 64296
    	},
    	{
    		county: "Elbert County",
    		state: "GA",
    		pop: 19194
    	},
    	{
    		county: "Emanuel County",
    		state: "GA",
    		pop: 22646
    	},
    	{
    		county: "Evans County",
    		state: "GA",
    		pop: 10654
    	},
    	{
    		county: "Fannin County",
    		state: "GA",
    		pop: 26188
    	},
    	{
    		county: "Fayette County",
    		state: "GA",
    		pop: 114421
    	},
    	{
    		county: "Floyd County",
    		state: "GA",
    		pop: 98498
    	},
    	{
    		county: "Forsyth County",
    		state: "GA",
    		pop: 244252
    	},
    	{
    		county: "Franklin County",
    		state: "GA",
    		pop: 23349
    	},
    	{
    		county: "Fulton County",
    		state: "GA",
    		pop: 1063937
    	},
    	{
    		county: "Gilmer County",
    		state: "GA",
    		pop: 31369
    	},
    	{
    		county: "Glascock County",
    		state: "GA",
    		pop: 2971
    	},
    	{
    		county: "Glynn County",
    		state: "GA",
    		pop: 85292
    	},
    	{
    		county: "Gordon County",
    		state: "GA",
    		pop: 57963
    	},
    	{
    		county: "Grady County",
    		state: "GA",
    		pop: 24633
    	},
    	{
    		county: "Greene County",
    		state: "GA",
    		pop: 18324
    	},
    	{
    		county: "Gwinnett County",
    		state: "GA",
    		pop: 936250
    	},
    	{
    		county: "Habersham County",
    		state: "GA",
    		pop: 45328
    	},
    	{
    		county: "Hall County",
    		state: "GA",
    		pop: 204441
    	},
    	{
    		county: "Hancock County",
    		state: "GA",
    		pop: 8457
    	},
    	{
    		county: "Haralson County",
    		state: "GA",
    		pop: 29792
    	},
    	{
    		county: "Harris County",
    		state: "GA",
    		pop: 35236
    	},
    	{
    		county: "Hart County",
    		state: "GA",
    		pop: 26205
    	},
    	{
    		county: "Heard County",
    		state: "GA",
    		pop: 11923
    	},
    	{
    		county: "Henry County",
    		state: "GA",
    		pop: 234561
    	},
    	{
    		county: "Houston County",
    		state: "GA",
    		pop: 157863
    	},
    	{
    		county: "Irwin County",
    		state: "GA",
    		pop: 9416
    	},
    	{
    		county: "Jackson County",
    		state: "GA",
    		pop: 72977
    	},
    	{
    		county: "Jasper County",
    		state: "GA",
    		pop: 14219
    	},
    	{
    		county: "Jeff Davis County",
    		state: "GA",
    		pop: 15115
    	},
    	{
    		county: "Jefferson County",
    		state: "GA",
    		pop: 15362
    	},
    	{
    		county: "Jenkins County",
    		state: "GA",
    		pop: 8676
    	},
    	{
    		county: "Johnson County",
    		state: "GA",
    		pop: 9643
    	},
    	{
    		county: "Jones County",
    		state: "GA",
    		pop: 28735
    	},
    	{
    		county: "Lamar County",
    		state: "GA",
    		pop: 19077
    	},
    	{
    		county: "Lanier County",
    		state: "GA",
    		pop: 10423
    	},
    	{
    		county: "Laurens County",
    		state: "GA",
    		pop: 47546
    	},
    	{
    		county: "Lee County",
    		state: "GA",
    		pop: 29992
    	},
    	{
    		county: "Liberty County",
    		state: "GA",
    		pop: 61435
    	},
    	{
    		county: "Lincoln County",
    		state: "GA",
    		pop: 7921
    	},
    	{
    		county: "Long County",
    		state: "GA",
    		pop: 19559
    	},
    	{
    		county: "Lowndes County",
    		state: "GA",
    		pop: 117406
    	},
    	{
    		county: "Lumpkin County",
    		state: "GA",
    		pop: 33610
    	},
    	{
    		county: "McDuffie County",
    		state: "GA",
    		pop: 21312
    	},
    	{
    		county: "McIntosh County",
    		state: "GA",
    		pop: 14378
    	},
    	{
    		county: "Macon County",
    		state: "GA",
    		pop: 12947
    	},
    	{
    		county: "Madison County",
    		state: "GA",
    		pop: 29880
    	},
    	{
    		county: "Marion County",
    		state: "GA",
    		pop: 8359
    	},
    	{
    		county: "Meriwether County",
    		state: "GA",
    		pop: 21167
    	},
    	{
    		county: "Miller County",
    		state: "GA",
    		pop: 5718
    	},
    	{
    		county: "Mitchell County",
    		state: "GA",
    		pop: 21863
    	},
    	{
    		county: "Monroe County",
    		state: "GA",
    		pop: 27578
    	},
    	{
    		county: "Montgomery County",
    		state: "GA",
    		pop: 9172
    	},
    	{
    		county: "Morgan County",
    		state: "GA",
    		pop: 19276
    	},
    	{
    		county: "Murray County",
    		state: "GA",
    		pop: 40096
    	},
    	{
    		county: "Muscogee County",
    		state: "GA",
    		pop: 195769
    	},
    	{
    		county: "Newton County",
    		state: "GA",
    		pop: 111744
    	},
    	{
    		county: "Oconee County",
    		state: "GA",
    		pop: 40280
    	},
    	{
    		county: "Oglethorpe County",
    		state: "GA",
    		pop: 15259
    	},
    	{
    		county: "Paulding County",
    		state: "GA",
    		pop: 168667
    	},
    	{
    		county: "Peach County",
    		state: "GA",
    		pop: 27546
    	},
    	{
    		county: "Pickens County",
    		state: "GA",
    		pop: 32591
    	},
    	{
    		county: "Pierce County",
    		state: "GA",
    		pop: 19465
    	},
    	{
    		county: "Pike County",
    		state: "GA",
    		pop: 18962
    	},
    	{
    		county: "Polk County",
    		state: "GA",
    		pop: 42613
    	},
    	{
    		county: "Pulaski County",
    		state: "GA",
    		pop: 11137
    	},
    	{
    		county: "Putnam County",
    		state: "GA",
    		pop: 22119
    	},
    	{
    		county: "Quitman County",
    		state: "GA",
    		pop: 2299
    	},
    	{
    		county: "Rabun County",
    		state: "GA",
    		pop: 17137
    	},
    	{
    		county: "Randolph County",
    		state: "GA",
    		pop: 6778
    	},
    	{
    		county: "Richmond County",
    		state: "GA",
    		pop: 202518
    	},
    	{
    		county: "Rockdale County",
    		state: "GA",
    		pop: 90896
    	},
    	{
    		county: "Schley County",
    		state: "GA",
    		pop: 5257
    	},
    	{
    		county: "Screven County",
    		state: "GA",
    		pop: 13966
    	},
    	{
    		county: "Seminole County",
    		state: "GA",
    		pop: 8090
    	},
    	{
    		county: "Spalding County",
    		state: "GA",
    		pop: 66703
    	},
    	{
    		county: "Stephens County",
    		state: "GA",
    		pop: 25925
    	},
    	{
    		county: "Stewart County",
    		state: "GA",
    		pop: 6621
    	},
    	{
    		county: "Sumter County",
    		state: "GA",
    		pop: 29524
    	},
    	{
    		county: "Talbot County",
    		state: "GA",
    		pop: 6195
    	},
    	{
    		county: "Taliaferro County",
    		state: "GA",
    		pop: 1537
    	},
    	{
    		county: "Tattnall County",
    		state: "GA",
    		pop: 25286
    	},
    	{
    		county: "Taylor County",
    		state: "GA",
    		pop: 8020
    	},
    	{
    		county: "Telfair County",
    		state: "GA",
    		pop: 15860
    	},
    	{
    		county: "Terrell County",
    		state: "GA",
    		pop: 8531
    	},
    	{
    		county: "Thomas County",
    		state: "GA",
    		pop: 44451
    	},
    	{
    		county: "Tift County",
    		state: "GA",
    		pop: 40644
    	},
    	{
    		county: "Toombs County",
    		state: "GA",
    		pop: 26830
    	},
    	{
    		county: "Towns County",
    		state: "GA",
    		pop: 12037
    	},
    	{
    		county: "Treutlen County",
    		state: "GA",
    		pop: 6901
    	},
    	{
    		county: "Troup County",
    		state: "GA",
    		pop: 69922
    	},
    	{
    		county: "Turner County",
    		state: "GA",
    		pop: 7985
    	},
    	{
    		county: "Twiggs County",
    		state: "GA",
    		pop: 8120
    	},
    	{
    		county: "Union County",
    		state: "GA",
    		pop: 24511
    	},
    	{
    		county: "Upson County",
    		state: "GA",
    		pop: 26320
    	},
    	{
    		county: "Walker County",
    		state: "GA",
    		pop: 69761
    	},
    	{
    		county: "Walton County",
    		state: "GA",
    		pop: 94593
    	},
    	{
    		county: "Ware County",
    		state: "GA",
    		pop: 35734
    	},
    	{
    		county: "Warren County",
    		state: "GA",
    		pop: 5254
    	},
    	{
    		county: "Washington County",
    		state: "GA",
    		pop: 20374
    	},
    	{
    		county: "Wayne County",
    		state: "GA",
    		pop: 29927
    	},
    	{
    		county: "Webster County",
    		state: "GA",
    		pop: 2607
    	},
    	{
    		county: "Wheeler County",
    		state: "GA",
    		pop: 7855
    	},
    	{
    		county: "White County",
    		state: "GA",
    		pop: 30798
    	},
    	{
    		county: "Whitfield County",
    		state: "GA",
    		pop: 104628
    	},
    	{
    		county: "Wilcox County",
    		state: "GA",
    		pop: 8635
    	},
    	{
    		county: "Wilkes County",
    		state: "GA",
    		pop: 9777
    	},
    	{
    		county: "Wilkinson County",
    		state: "GA",
    		pop: 8954
    	},
    	{
    		county: "Worth County",
    		state: "GA",
    		pop: 20247
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "HI",
    		pop: 0
    	},
    	{
    		county: "Hawaii County",
    		state: "HI",
    		pop: 201513
    	},
    	{
    		county: "Honolulu County",
    		state: "HI",
    		pop: 974563
    	},
    	{
    		county: "Kalawao County",
    		state: "HI",
    		pop: 86
    	},
    	{
    		county: "Kauai County",
    		state: "HI",
    		pop: 72293
    	},
    	{
    		county: "Maui County",
    		state: "HI",
    		pop: 167417
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "ID",
    		pop: 0
    	},
    	{
    		county: "Ada County",
    		state: "ID",
    		pop: 481587
    	},
    	{
    		county: "Adams County",
    		state: "ID",
    		pop: 4294
    	},
    	{
    		county: "Bannock County",
    		state: "ID",
    		pop: 87808
    	},
    	{
    		county: "Bear Lake County",
    		state: "ID",
    		pop: 6125
    	},
    	{
    		county: "Benewah County",
    		state: "ID",
    		pop: 9298
    	},
    	{
    		county: "Bingham County",
    		state: "ID",
    		pop: 46811
    	},
    	{
    		county: "Blaine County",
    		state: "ID",
    		pop: 23021
    	},
    	{
    		county: "Boise County",
    		state: "ID",
    		pop: 7831
    	},
    	{
    		county: "Bonner County",
    		state: "ID",
    		pop: 45739
    	},
    	{
    		county: "Bonneville County",
    		state: "ID",
    		pop: 119062
    	},
    	{
    		county: "Boundary County",
    		state: "ID",
    		pop: 12245
    	},
    	{
    		county: "Butte County",
    		state: "ID",
    		pop: 2597
    	},
    	{
    		county: "Camas County",
    		state: "ID",
    		pop: 1106
    	},
    	{
    		county: "Canyon County",
    		state: "ID",
    		pop: 229849
    	},
    	{
    		county: "Caribou County",
    		state: "ID",
    		pop: 7155
    	},
    	{
    		county: "Cassia County",
    		state: "ID",
    		pop: 24030
    	},
    	{
    		county: "Clark County",
    		state: "ID",
    		pop: 845
    	},
    	{
    		county: "Clearwater County",
    		state: "ID",
    		pop: 8756
    	},
    	{
    		county: "Custer County",
    		state: "ID",
    		pop: 4315
    	},
    	{
    		county: "Elmore County",
    		state: "ID",
    		pop: 27511
    	},
    	{
    		county: "Franklin County",
    		state: "ID",
    		pop: 13876
    	},
    	{
    		county: "Fremont County",
    		state: "ID",
    		pop: 13099
    	},
    	{
    		county: "Gem County",
    		state: "ID",
    		pop: 18112
    	},
    	{
    		county: "Gooding County",
    		state: "ID",
    		pop: 15179
    	},
    	{
    		county: "Idaho County",
    		state: "ID",
    		pop: 16667
    	},
    	{
    		county: "Jefferson County",
    		state: "ID",
    		pop: 29871
    	},
    	{
    		county: "Jerome County",
    		state: "ID",
    		pop: 24412
    	},
    	{
    		county: "Kootenai County",
    		state: "ID",
    		pop: 165697
    	},
    	{
    		county: "Latah County",
    		state: "ID",
    		pop: 40108
    	},
    	{
    		county: "Lemhi County",
    		state: "ID",
    		pop: 8027
    	},
    	{
    		county: "Lewis County",
    		state: "ID",
    		pop: 3838
    	},
    	{
    		county: "Lincoln County",
    		state: "ID",
    		pop: 5366
    	},
    	{
    		county: "Madison County",
    		state: "ID",
    		pop: 39907
    	},
    	{
    		county: "Minidoka County",
    		state: "ID",
    		pop: 21039
    	},
    	{
    		county: "Nez Perce County",
    		state: "ID",
    		pop: 40408
    	},
    	{
    		county: "Oneida County",
    		state: "ID",
    		pop: 4531
    	},
    	{
    		county: "Owyhee County",
    		state: "ID",
    		pop: 11823
    	},
    	{
    		county: "Payette County",
    		state: "ID",
    		pop: 23951
    	},
    	{
    		county: "Power County",
    		state: "ID",
    		pop: 7681
    	},
    	{
    		county: "Shoshone County",
    		state: "ID",
    		pop: 12882
    	},
    	{
    		county: "Teton County",
    		state: "ID",
    		pop: 12142
    	},
    	{
    		county: "Twin Falls County",
    		state: "ID",
    		pop: 86878
    	},
    	{
    		county: "Valley County",
    		state: "ID",
    		pop: 11392
    	},
    	{
    		county: "Washington County",
    		state: "ID",
    		pop: 10194
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "IL",
    		pop: 0
    	},
    	{
    		county: "Adams County",
    		state: "IL",
    		pop: 65435
    	},
    	{
    		county: "Alexander County",
    		state: "IL",
    		pop: 5761
    	},
    	{
    		county: "Bond County",
    		state: "IL",
    		pop: 16426
    	},
    	{
    		county: "Boone County",
    		state: "IL",
    		pop: 53544
    	},
    	{
    		county: "Brown County",
    		state: "IL",
    		pop: 6578
    	},
    	{
    		county: "Bureau County",
    		state: "IL",
    		pop: 32628
    	},
    	{
    		county: "Calhoun County",
    		state: "IL",
    		pop: 4739
    	},
    	{
    		county: "Carroll County",
    		state: "IL",
    		pop: 14305
    	},
    	{
    		county: "Cass County",
    		state: "IL",
    		pop: 12147
    	},
    	{
    		county: "Champaign County",
    		state: "IL",
    		pop: 209689
    	},
    	{
    		county: "Christian County",
    		state: "IL",
    		pop: 32304
    	},
    	{
    		county: "Clark County",
    		state: "IL",
    		pop: 15441
    	},
    	{
    		county: "Clay County",
    		state: "IL",
    		pop: 13184
    	},
    	{
    		county: "Clinton County",
    		state: "IL",
    		pop: 37562
    	},
    	{
    		county: "Coles County",
    		state: "IL",
    		pop: 50621
    	},
    	{
    		county: "Cook County",
    		state: "IL",
    		pop: 5150233
    	},
    	{
    		county: "Crawford County",
    		state: "IL",
    		pop: 18667
    	},
    	{
    		county: "Cumberland County",
    		state: "IL",
    		pop: 10766
    	},
    	{
    		county: "DeKalb County",
    		state: "IL",
    		pop: 104897
    	},
    	{
    		county: "De Witt County",
    		state: "IL",
    		pop: 15638
    	},
    	{
    		county: "Douglas County",
    		state: "IL",
    		pop: 19465
    	},
    	{
    		county: "DuPage County",
    		state: "IL",
    		pop: 922921
    	},
    	{
    		county: "Edgar County",
    		state: "IL",
    		pop: 17161
    	},
    	{
    		county: "Edwards County",
    		state: "IL",
    		pop: 6395
    	},
    	{
    		county: "Effingham County",
    		state: "IL",
    		pop: 34008
    	},
    	{
    		county: "Fayette County",
    		state: "IL",
    		pop: 21336
    	},
    	{
    		county: "Ford County",
    		state: "IL",
    		pop: 12961
    	},
    	{
    		county: "Franklin County",
    		state: "IL",
    		pop: 38469
    	},
    	{
    		county: "Fulton County",
    		state: "IL",
    		pop: 34340
    	},
    	{
    		county: "Gallatin County",
    		state: "IL",
    		pop: 4828
    	},
    	{
    		county: "Greene County",
    		state: "IL",
    		pop: 12969
    	},
    	{
    		county: "Grundy County",
    		state: "IL",
    		pop: 51054
    	},
    	{
    		county: "Hamilton County",
    		state: "IL",
    		pop: 8116
    	},
    	{
    		county: "Hancock County",
    		state: "IL",
    		pop: 17708
    	},
    	{
    		county: "Hardin County",
    		state: "IL",
    		pop: 3821
    	},
    	{
    		county: "Henderson County",
    		state: "IL",
    		pop: 6646
    	},
    	{
    		county: "Henry County",
    		state: "IL",
    		pop: 48913
    	},
    	{
    		county: "Iroquois County",
    		state: "IL",
    		pop: 27114
    	},
    	{
    		county: "Jackson County",
    		state: "IL",
    		pop: 56750
    	},
    	{
    		county: "Jasper County",
    		state: "IL",
    		pop: 9610
    	},
    	{
    		county: "Jefferson County",
    		state: "IL",
    		pop: 37684
    	},
    	{
    		county: "Jersey County",
    		state: "IL",
    		pop: 21773
    	},
    	{
    		county: "Jo Daviess County",
    		state: "IL",
    		pop: 21235
    	},
    	{
    		county: "Johnson County",
    		state: "IL",
    		pop: 12417
    	},
    	{
    		county: "Kane County",
    		state: "IL",
    		pop: 532403
    	},
    	{
    		county: "Kankakee County",
    		state: "IL",
    		pop: 109862
    	},
    	{
    		county: "Kendall County",
    		state: "IL",
    		pop: 128990
    	},
    	{
    		county: "Knox County",
    		state: "IL",
    		pop: 49699
    	},
    	{
    		county: "Lake County",
    		state: "IL",
    		pop: 696535
    	},
    	{
    		county: "LaSalle County",
    		state: "IL",
    		pop: 108669
    	},
    	{
    		county: "Lawrence County",
    		state: "IL",
    		pop: 15678
    	},
    	{
    		county: "Lee County",
    		state: "IL",
    		pop: 34096
    	},
    	{
    		county: "Livingston County",
    		state: "IL",
    		pop: 35648
    	},
    	{
    		county: "Logan County",
    		state: "IL",
    		pop: 28618
    	},
    	{
    		county: "McDonough County",
    		state: "IL",
    		pop: 29682
    	},
    	{
    		county: "McHenry County",
    		state: "IL",
    		pop: 307774
    	},
    	{
    		county: "McLean County",
    		state: "IL",
    		pop: 171517
    	},
    	{
    		county: "Macon County",
    		state: "IL",
    		pop: 104009
    	},
    	{
    		county: "Macoupin County",
    		state: "IL",
    		pop: 44926
    	},
    	{
    		county: "Madison County",
    		state: "IL",
    		pop: 262966
    	},
    	{
    		county: "Marion County",
    		state: "IL",
    		pop: 37205
    	},
    	{
    		county: "Marshall County",
    		state: "IL",
    		pop: 11438
    	},
    	{
    		county: "Mason County",
    		state: "IL",
    		pop: 13359
    	},
    	{
    		county: "Massac County",
    		state: "IL",
    		pop: 13772
    	},
    	{
    		county: "Menard County",
    		state: "IL",
    		pop: 12196
    	},
    	{
    		county: "Mercer County",
    		state: "IL",
    		pop: 15437
    	},
    	{
    		county: "Monroe County",
    		state: "IL",
    		pop: 34637
    	},
    	{
    		county: "Montgomery County",
    		state: "IL",
    		pop: 28414
    	},
    	{
    		county: "Morgan County",
    		state: "IL",
    		pop: 33658
    	},
    	{
    		county: "Moultrie County",
    		state: "IL",
    		pop: 14501
    	},
    	{
    		county: "Ogle County",
    		state: "IL",
    		pop: 50643
    	},
    	{
    		county: "Peoria County",
    		state: "IL",
    		pop: 179179
    	},
    	{
    		county: "Perry County",
    		state: "IL",
    		pop: 20916
    	},
    	{
    		county: "Piatt County",
    		state: "IL",
    		pop: 16344
    	},
    	{
    		county: "Pike County",
    		state: "IL",
    		pop: 15561
    	},
    	{
    		county: "Pope County",
    		state: "IL",
    		pop: 4177
    	},
    	{
    		county: "Pulaski County",
    		state: "IL",
    		pop: 5335
    	},
    	{
    		county: "Putnam County",
    		state: "IL",
    		pop: 5739
    	},
    	{
    		county: "Randolph County",
    		state: "IL",
    		pop: 31782
    	},
    	{
    		county: "Richland County",
    		state: "IL",
    		pop: 15513
    	},
    	{
    		county: "Rock Island County",
    		state: "IL",
    		pop: 141879
    	},
    	{
    		county: "St. Clair County",
    		state: "IL",
    		pop: 259686
    	},
    	{
    		county: "Saline County",
    		state: "IL",
    		pop: 23491
    	},
    	{
    		county: "Sangamon County",
    		state: "IL",
    		pop: 194672
    	},
    	{
    		county: "Schuyler County",
    		state: "IL",
    		pop: 6768
    	},
    	{
    		county: "Scott County",
    		state: "IL",
    		pop: 4951
    	},
    	{
    		county: "Shelby County",
    		state: "IL",
    		pop: 21634
    	},
    	{
    		county: "Stark County",
    		state: "IL",
    		pop: 5342
    	},
    	{
    		county: "Stephenson County",
    		state: "IL",
    		pop: 44498
    	},
    	{
    		county: "Tazewell County",
    		state: "IL",
    		pop: 131803
    	},
    	{
    		county: "Union County",
    		state: "IL",
    		pop: 16653
    	},
    	{
    		county: "Vermilion County",
    		state: "IL",
    		pop: 75758
    	},
    	{
    		county: "Wabash County",
    		state: "IL",
    		pop: 11520
    	},
    	{
    		county: "Warren County",
    		state: "IL",
    		pop: 16844
    	},
    	{
    		county: "Washington County",
    		state: "IL",
    		pop: 13887
    	},
    	{
    		county: "Wayne County",
    		state: "IL",
    		pop: 16215
    	},
    	{
    		county: "White County",
    		state: "IL",
    		pop: 13537
    	},
    	{
    		county: "Whiteside County",
    		state: "IL",
    		pop: 55175
    	},
    	{
    		county: "Will County",
    		state: "IL",
    		pop: 690743
    	},
    	{
    		county: "Williamson County",
    		state: "IL",
    		pop: 66597
    	},
    	{
    		county: "Winnebago County",
    		state: "IL",
    		pop: 282572
    	},
    	{
    		county: "Woodford County",
    		state: "IL",
    		pop: 38459
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "IN",
    		pop: 0
    	},
    	{
    		county: "Adams County",
    		state: "IN",
    		pop: 35777
    	},
    	{
    		county: "Allen County",
    		state: "IN",
    		pop: 379299
    	},
    	{
    		county: "Bartholomew County",
    		state: "IN",
    		pop: 83779
    	},
    	{
    		county: "Benton County",
    		state: "IN",
    		pop: 8748
    	},
    	{
    		county: "Blackford County",
    		state: "IN",
    		pop: 11758
    	},
    	{
    		county: "Boone County",
    		state: "IN",
    		pop: 67843
    	},
    	{
    		county: "Brown County",
    		state: "IN",
    		pop: 15092
    	},
    	{
    		county: "Carroll County",
    		state: "IN",
    		pop: 20257
    	},
    	{
    		county: "Cass County",
    		state: "IN",
    		pop: 37689
    	},
    	{
    		county: "Clark County",
    		state: "IN",
    		pop: 118302
    	},
    	{
    		county: "Clay County",
    		state: "IN",
    		pop: 26225
    	},
    	{
    		county: "Clinton County",
    		state: "IN",
    		pop: 32399
    	},
    	{
    		county: "Crawford County",
    		state: "IN",
    		pop: 10577
    	},
    	{
    		county: "Daviess County",
    		state: "IN",
    		pop: 33351
    	},
    	{
    		county: "Dearborn County",
    		state: "IN",
    		pop: 49458
    	},
    	{
    		county: "Decatur County",
    		state: "IN",
    		pop: 26559
    	},
    	{
    		county: "DeKalb County",
    		state: "IN",
    		pop: 43475
    	},
    	{
    		county: "Delaware County",
    		state: "IN",
    		pop: 114135
    	},
    	{
    		county: "Dubois County",
    		state: "IN",
    		pop: 42736
    	},
    	{
    		county: "Elkhart County",
    		state: "IN",
    		pop: 206341
    	},
    	{
    		county: "Fayette County",
    		state: "IN",
    		pop: 23102
    	},
    	{
    		county: "Floyd County",
    		state: "IN",
    		pop: 78522
    	},
    	{
    		county: "Fountain County",
    		state: "IN",
    		pop: 16346
    	},
    	{
    		county: "Franklin County",
    		state: "IN",
    		pop: 22758
    	},
    	{
    		county: "Fulton County",
    		state: "IN",
    		pop: 19974
    	},
    	{
    		county: "Gibson County",
    		state: "IN",
    		pop: 33659
    	},
    	{
    		county: "Grant County",
    		state: "IN",
    		pop: 65769
    	},
    	{
    		county: "Greene County",
    		state: "IN",
    		pop: 31922
    	},
    	{
    		county: "Hamilton County",
    		state: "IN",
    		pop: 338011
    	},
    	{
    		county: "Hancock County",
    		state: "IN",
    		pop: 78168
    	},
    	{
    		county: "Harrison County",
    		state: "IN",
    		pop: 40515
    	},
    	{
    		county: "Hendricks County",
    		state: "IN",
    		pop: 170311
    	},
    	{
    		county: "Henry County",
    		state: "IN",
    		pop: 47972
    	},
    	{
    		county: "Howard County",
    		state: "IN",
    		pop: 82544
    	},
    	{
    		county: "Huntington County",
    		state: "IN",
    		pop: 36520
    	},
    	{
    		county: "Jackson County",
    		state: "IN",
    		pop: 44231
    	},
    	{
    		county: "Jasper County",
    		state: "IN",
    		pop: 33562
    	},
    	{
    		county: "Jay County",
    		state: "IN",
    		pop: 20436
    	},
    	{
    		county: "Jefferson County",
    		state: "IN",
    		pop: 32308
    	},
    	{
    		county: "Jennings County",
    		state: "IN",
    		pop: 27735
    	},
    	{
    		county: "Johnson County",
    		state: "IN",
    		pop: 158167
    	},
    	{
    		county: "Knox County",
    		state: "IN",
    		pop: 36594
    	},
    	{
    		county: "Kosciusko County",
    		state: "IN",
    		pop: 79456
    	},
    	{
    		county: "LaGrange County",
    		state: "IN",
    		pop: 39614
    	},
    	{
    		county: "Lake County",
    		state: "IN",
    		pop: 485493
    	},
    	{
    		county: "LaPorte County",
    		state: "IN",
    		pop: 109888
    	},
    	{
    		county: "Lawrence County",
    		state: "IN",
    		pop: 45370
    	},
    	{
    		county: "Madison County",
    		state: "IN",
    		pop: 129569
    	},
    	{
    		county: "Marion County",
    		state: "IN",
    		pop: 964582
    	},
    	{
    		county: "Marshall County",
    		state: "IN",
    		pop: 46258
    	},
    	{
    		county: "Martin County",
    		state: "IN",
    		pop: 10255
    	},
    	{
    		county: "Miami County",
    		state: "IN",
    		pop: 35516
    	},
    	{
    		county: "Monroe County",
    		state: "IN",
    		pop: 148431
    	},
    	{
    		county: "Montgomery County",
    		state: "IN",
    		pop: 38338
    	},
    	{
    		county: "Morgan County",
    		state: "IN",
    		pop: 70489
    	},
    	{
    		county: "Newton County",
    		state: "IN",
    		pop: 13984
    	},
    	{
    		county: "Noble County",
    		state: "IN",
    		pop: 47744
    	},
    	{
    		county: "Ohio County",
    		state: "IN",
    		pop: 5875
    	},
    	{
    		county: "Orange County",
    		state: "IN",
    		pop: 19646
    	},
    	{
    		county: "Owen County",
    		state: "IN",
    		pop: 20799
    	},
    	{
    		county: "Parke County",
    		state: "IN",
    		pop: 16937
    	},
    	{
    		county: "Perry County",
    		state: "IN",
    		pop: 19169
    	},
    	{
    		county: "Pike County",
    		state: "IN",
    		pop: 12389
    	},
    	{
    		county: "Porter County",
    		state: "IN",
    		pop: 170389
    	},
    	{
    		county: "Posey County",
    		state: "IN",
    		pop: 25427
    	},
    	{
    		county: "Pulaski County",
    		state: "IN",
    		pop: 12353
    	},
    	{
    		county: "Putnam County",
    		state: "IN",
    		pop: 37576
    	},
    	{
    		county: "Randolph County",
    		state: "IN",
    		pop: 24665
    	},
    	{
    		county: "Ripley County",
    		state: "IN",
    		pop: 28324
    	},
    	{
    		county: "Rush County",
    		state: "IN",
    		pop: 16581
    	},
    	{
    		county: "St. Joseph County",
    		state: "IN",
    		pop: 271826
    	},
    	{
    		county: "Scott County",
    		state: "IN",
    		pop: 23873
    	},
    	{
    		county: "Shelby County",
    		state: "IN",
    		pop: 44729
    	},
    	{
    		county: "Spencer County",
    		state: "IN",
    		pop: 20277
    	},
    	{
    		county: "Starke County",
    		state: "IN",
    		pop: 22995
    	},
    	{
    		county: "Steuben County",
    		state: "IN",
    		pop: 34594
    	},
    	{
    		county: "Sullivan County",
    		state: "IN",
    		pop: 20669
    	},
    	{
    		county: "Switzerland County",
    		state: "IN",
    		pop: 10751
    	},
    	{
    		county: "Tippecanoe County",
    		state: "IN",
    		pop: 195732
    	},
    	{
    		county: "Tipton County",
    		state: "IN",
    		pop: 15148
    	},
    	{
    		county: "Union County",
    		state: "IN",
    		pop: 7054
    	},
    	{
    		county: "Vanderburgh County",
    		state: "IN",
    		pop: 181451
    	},
    	{
    		county: "Vermillion County",
    		state: "IN",
    		pop: 15498
    	},
    	{
    		county: "Vigo County",
    		state: "IN",
    		pop: 107038
    	},
    	{
    		county: "Wabash County",
    		state: "IN",
    		pop: 30996
    	},
    	{
    		county: "Warren County",
    		state: "IN",
    		pop: 8265
    	},
    	{
    		county: "Warrick County",
    		state: "IN",
    		pop: 62998
    	},
    	{
    		county: "Washington County",
    		state: "IN",
    		pop: 28036
    	},
    	{
    		county: "Wayne County",
    		state: "IN",
    		pop: 65884
    	},
    	{
    		county: "Wells County",
    		state: "IN",
    		pop: 28296
    	},
    	{
    		county: "White County",
    		state: "IN",
    		pop: 24102
    	},
    	{
    		county: "Whitley County",
    		state: "IN",
    		pop: 33964
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "IA",
    		pop: 0
    	},
    	{
    		county: "Adair County",
    		state: "IA",
    		pop: 7152
    	},
    	{
    		county: "Adams County",
    		state: "IA",
    		pop: 3602
    	},
    	{
    		county: "Allamakee County",
    		state: "IA",
    		pop: 13687
    	},
    	{
    		county: "Appanoose County",
    		state: "IA",
    		pop: 12426
    	},
    	{
    		county: "Audubon County",
    		state: "IA",
    		pop: 5496
    	},
    	{
    		county: "Benton County",
    		state: "IA",
    		pop: 25645
    	},
    	{
    		county: "Black Hawk County",
    		state: "IA",
    		pop: 131228
    	},
    	{
    		county: "Boone County",
    		state: "IA",
    		pop: 26234
    	},
    	{
    		county: "Bremer County",
    		state: "IA",
    		pop: 25062
    	},
    	{
    		county: "Buchanan County",
    		state: "IA",
    		pop: 21175
    	},
    	{
    		county: "Buena Vista County",
    		state: "IA",
    		pop: 19620
    	},
    	{
    		county: "Butler County",
    		state: "IA",
    		pop: 14439
    	},
    	{
    		county: "Calhoun County",
    		state: "IA",
    		pop: 9668
    	},
    	{
    		county: "Carroll County",
    		state: "IA",
    		pop: 20165
    	},
    	{
    		county: "Cass County",
    		state: "IA",
    		pop: 12836
    	},
    	{
    		county: "Cedar County",
    		state: "IA",
    		pop: 18627
    	},
    	{
    		county: "Cerro Gordo County",
    		state: "IA",
    		pop: 42450
    	},
    	{
    		county: "Cherokee County",
    		state: "IA",
    		pop: 11235
    	},
    	{
    		county: "Chickasaw County",
    		state: "IA",
    		pop: 11933
    	},
    	{
    		county: "Clarke County",
    		state: "IA",
    		pop: 9395
    	},
    	{
    		county: "Clay County",
    		state: "IA",
    		pop: 16016
    	},
    	{
    		county: "Clayton County",
    		state: "IA",
    		pop: 17549
    	},
    	{
    		county: "Clinton County",
    		state: "IA",
    		pop: 46429
    	},
    	{
    		county: "Crawford County",
    		state: "IA",
    		pop: 16820
    	},
    	{
    		county: "Dallas County",
    		state: "IA",
    		pop: 93453
    	},
    	{
    		county: "Davis County",
    		state: "IA",
    		pop: 9000
    	},
    	{
    		county: "Decatur County",
    		state: "IA",
    		pop: 7870
    	},
    	{
    		county: "Delaware County",
    		state: "IA",
    		pop: 17011
    	},
    	{
    		county: "Des Moines County",
    		state: "IA",
    		pop: 38967
    	},
    	{
    		county: "Dickinson County",
    		state: "IA",
    		pop: 17258
    	},
    	{
    		county: "Dubuque County",
    		state: "IA",
    		pop: 97311
    	},
    	{
    		county: "Emmet County",
    		state: "IA",
    		pop: 9208
    	},
    	{
    		county: "Fayette County",
    		state: "IA",
    		pop: 19650
    	},
    	{
    		county: "Floyd County",
    		state: "IA",
    		pop: 15642
    	},
    	{
    		county: "Franklin County",
    		state: "IA",
    		pop: 10070
    	},
    	{
    		county: "Fremont County",
    		state: "IA",
    		pop: 6960
    	},
    	{
    		county: "Greene County",
    		state: "IA",
    		pop: 8888
    	},
    	{
    		county: "Grundy County",
    		state: "IA",
    		pop: 12232
    	},
    	{
    		county: "Guthrie County",
    		state: "IA",
    		pop: 10689
    	},
    	{
    		county: "Hamilton County",
    		state: "IA",
    		pop: 14773
    	},
    	{
    		county: "Hancock County",
    		state: "IA",
    		pop: 10630
    	},
    	{
    		county: "Hardin County",
    		state: "IA",
    		pop: 16846
    	},
    	{
    		county: "Harrison County",
    		state: "IA",
    		pop: 14049
    	},
    	{
    		county: "Henry County",
    		state: "IA",
    		pop: 19954
    	},
    	{
    		county: "Howard County",
    		state: "IA",
    		pop: 9158
    	},
    	{
    		county: "Humboldt County",
    		state: "IA",
    		pop: 9558
    	},
    	{
    		county: "Ida County",
    		state: "IA",
    		pop: 6860
    	},
    	{
    		county: "Iowa County",
    		state: "IA",
    		pop: 16184
    	},
    	{
    		county: "Jackson County",
    		state: "IA",
    		pop: 19439
    	},
    	{
    		county: "Jasper County",
    		state: "IA",
    		pop: 37185
    	},
    	{
    		county: "Jefferson County",
    		state: "IA",
    		pop: 18295
    	},
    	{
    		county: "Johnson County",
    		state: "IA",
    		pop: 151140
    	},
    	{
    		county: "Jones County",
    		state: "IA",
    		pop: 20681
    	},
    	{
    		county: "Keokuk County",
    		state: "IA",
    		pop: 10246
    	},
    	{
    		county: "Kossuth County",
    		state: "IA",
    		pop: 14813
    	},
    	{
    		county: "Lee County",
    		state: "IA",
    		pop: 33657
    	},
    	{
    		county: "Linn County",
    		state: "IA",
    		pop: 226706
    	},
    	{
    		county: "Louisa County",
    		state: "IA",
    		pop: 11035
    	},
    	{
    		county: "Lucas County",
    		state: "IA",
    		pop: 8600
    	},
    	{
    		county: "Lyon County",
    		state: "IA",
    		pop: 11755
    	},
    	{
    		county: "Madison County",
    		state: "IA",
    		pop: 16338
    	},
    	{
    		county: "Mahaska County",
    		state: "IA",
    		pop: 22095
    	},
    	{
    		county: "Marion County",
    		state: "IA",
    		pop: 33253
    	},
    	{
    		county: "Marshall County",
    		state: "IA",
    		pop: 39369
    	},
    	{
    		county: "Mills County",
    		state: "IA",
    		pop: 15109
    	},
    	{
    		county: "Mitchell County",
    		state: "IA",
    		pop: 10586
    	},
    	{
    		county: "Monona County",
    		state: "IA",
    		pop: 8615
    	},
    	{
    		county: "Monroe County",
    		state: "IA",
    		pop: 7707
    	},
    	{
    		county: "Montgomery County",
    		state: "IA",
    		pop: 9917
    	},
    	{
    		county: "Muscatine County",
    		state: "IA",
    		pop: 42664
    	},
    	{
    		county: "O'Brien County",
    		state: "IA",
    		pop: 13753
    	},
    	{
    		county: "Osceola County",
    		state: "IA",
    		pop: 5958
    	},
    	{
    		county: "Page County",
    		state: "IA",
    		pop: 15107
    	},
    	{
    		county: "Palo Alto County",
    		state: "IA",
    		pop: 8886
    	},
    	{
    		county: "Plymouth County",
    		state: "IA",
    		pop: 25177
    	},
    	{
    		county: "Pocahontas County",
    		state: "IA",
    		pop: 6619
    	},
    	{
    		county: "Polk County",
    		state: "IA",
    		pop: 490161
    	},
    	{
    		county: "Pottawattamie County",
    		state: "IA",
    		pop: 93206
    	},
    	{
    		county: "Poweshiek County",
    		state: "IA",
    		pop: 18504
    	},
    	{
    		county: "Ringgold County",
    		state: "IA",
    		pop: 4894
    	},
    	{
    		county: "Sac County",
    		state: "IA",
    		pop: 9721
    	},
    	{
    		county: "Scott County",
    		state: "IA",
    		pop: 172943
    	},
    	{
    		county: "Shelby County",
    		state: "IA",
    		pop: 11454
    	},
    	{
    		county: "Sioux County",
    		state: "IA",
    		pop: 34855
    	},
    	{
    		county: "Story County",
    		state: "IA",
    		pop: 97117
    	},
    	{
    		county: "Tama County",
    		state: "IA",
    		pop: 16854
    	},
    	{
    		county: "Taylor County",
    		state: "IA",
    		pop: 6121
    	},
    	{
    		county: "Union County",
    		state: "IA",
    		pop: 12241
    	},
    	{
    		county: "Van Buren County",
    		state: "IA",
    		pop: 7044
    	},
    	{
    		county: "Wapello County",
    		state: "IA",
    		pop: 34969
    	},
    	{
    		county: "Warren County",
    		state: "IA",
    		pop: 51466
    	},
    	{
    		county: "Washington County",
    		state: "IA",
    		pop: 21965
    	},
    	{
    		county: "Wayne County",
    		state: "IA",
    		pop: 6441
    	},
    	{
    		county: "Webster County",
    		state: "IA",
    		pop: 35904
    	},
    	{
    		county: "Winnebago County",
    		state: "IA",
    		pop: 10354
    	},
    	{
    		county: "Winneshiek County",
    		state: "IA",
    		pop: 19991
    	},
    	{
    		county: "Woodbury County",
    		state: "IA",
    		pop: 103107
    	},
    	{
    		county: "Worth County",
    		state: "IA",
    		pop: 7381
    	},
    	{
    		county: "Wright County",
    		state: "IA",
    		pop: 12562
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "KS",
    		pop: 0
    	},
    	{
    		county: "Allen County",
    		state: "KS",
    		pop: 12369
    	},
    	{
    		county: "Anderson County",
    		state: "KS",
    		pop: 7858
    	},
    	{
    		county: "Atchison County",
    		state: "KS",
    		pop: 16073
    	},
    	{
    		county: "Barber County",
    		state: "KS",
    		pop: 4427
    	},
    	{
    		county: "Barton County",
    		state: "KS",
    		pop: 25779
    	},
    	{
    		county: "Bourbon County",
    		state: "KS",
    		pop: 14534
    	},
    	{
    		county: "Brown County",
    		state: "KS",
    		pop: 9564
    	},
    	{
    		county: "Butler County",
    		state: "KS",
    		pop: 66911
    	},
    	{
    		county: "Chase County",
    		state: "KS",
    		pop: 2648
    	},
    	{
    		county: "Chautauqua County",
    		state: "KS",
    		pop: 3250
    	},
    	{
    		county: "Cherokee County",
    		state: "KS",
    		pop: 19939
    	},
    	{
    		county: "Cheyenne County",
    		state: "KS",
    		pop: 2657
    	},
    	{
    		county: "Clark County",
    		state: "KS",
    		pop: 1994
    	},
    	{
    		county: "Clay County",
    		state: "KS",
    		pop: 8002
    	},
    	{
    		county: "Cloud County",
    		state: "KS",
    		pop: 8786
    	},
    	{
    		county: "Coffey County",
    		state: "KS",
    		pop: 8179
    	},
    	{
    		county: "Comanche County",
    		state: "KS",
    		pop: 1700
    	},
    	{
    		county: "Cowley County",
    		state: "KS",
    		pop: 34908
    	},
    	{
    		county: "Crawford County",
    		state: "KS",
    		pop: 38818
    	},
    	{
    		county: "Decatur County",
    		state: "KS",
    		pop: 2827
    	},
    	{
    		county: "Dickinson County",
    		state: "KS",
    		pop: 18466
    	},
    	{
    		county: "Doniphan County",
    		state: "KS",
    		pop: 7600
    	},
    	{
    		county: "Douglas County",
    		state: "KS",
    		pop: 122259
    	},
    	{
    		county: "Edwards County",
    		state: "KS",
    		pop: 2798
    	},
    	{
    		county: "Elk County",
    		state: "KS",
    		pop: 2530
    	},
    	{
    		county: "Ellis County",
    		state: "KS",
    		pop: 28553
    	},
    	{
    		county: "Ellsworth County",
    		state: "KS",
    		pop: 6102
    	},
    	{
    		county: "Finney County",
    		state: "KS",
    		pop: 36467
    	},
    	{
    		county: "Ford County",
    		state: "KS",
    		pop: 33619
    	},
    	{
    		county: "Franklin County",
    		state: "KS",
    		pop: 25544
    	},
    	{
    		county: "Geary County",
    		state: "KS",
    		pop: 31670
    	},
    	{
    		county: "Gove County",
    		state: "KS",
    		pop: 2636
    	},
    	{
    		county: "Graham County",
    		state: "KS",
    		pop: 2482
    	},
    	{
    		county: "Grant County",
    		state: "KS",
    		pop: 7150
    	},
    	{
    		county: "Gray County",
    		state: "KS",
    		pop: 5988
    	},
    	{
    		county: "Greeley County",
    		state: "KS",
    		pop: 1232
    	},
    	{
    		county: "Greenwood County",
    		state: "KS",
    		pop: 5982
    	},
    	{
    		county: "Hamilton County",
    		state: "KS",
    		pop: 2539
    	},
    	{
    		county: "Harper County",
    		state: "KS",
    		pop: 5436
    	},
    	{
    		county: "Harvey County",
    		state: "KS",
    		pop: 34429
    	},
    	{
    		county: "Haskell County",
    		state: "KS",
    		pop: 3968
    	},
    	{
    		county: "Hodgeman County",
    		state: "KS",
    		pop: 1794
    	},
    	{
    		county: "Jackson County",
    		state: "KS",
    		pop: 13171
    	},
    	{
    		county: "Jefferson County",
    		state: "KS",
    		pop: 19043
    	},
    	{
    		county: "Jewell County",
    		state: "KS",
    		pop: 2879
    	},
    	{
    		county: "Johnson County",
    		state: "KS",
    		pop: 602401
    	},
    	{
    		county: "Kearny County",
    		state: "KS",
    		pop: 3838
    	},
    	{
    		county: "Kingman County",
    		state: "KS",
    		pop: 7152
    	},
    	{
    		county: "Kiowa County",
    		state: "KS",
    		pop: 2475
    	},
    	{
    		county: "Labette County",
    		state: "KS",
    		pop: 19618
    	},
    	{
    		county: "Lane County",
    		state: "KS",
    		pop: 1535
    	},
    	{
    		county: "Leavenworth County",
    		state: "KS",
    		pop: 81758
    	},
    	{
    		county: "Lincoln County",
    		state: "KS",
    		pop: 2962
    	},
    	{
    		county: "Linn County",
    		state: "KS",
    		pop: 9703
    	},
    	{
    		county: "Logan County",
    		state: "KS",
    		pop: 2794
    	},
    	{
    		county: "Lyon County",
    		state: "KS",
    		pop: 33195
    	},
    	{
    		county: "McPherson County",
    		state: "KS",
    		pop: 28542
    	},
    	{
    		county: "Marion County",
    		state: "KS",
    		pop: 11884
    	},
    	{
    		county: "Marshall County",
    		state: "KS",
    		pop: 9707
    	},
    	{
    		county: "Meade County",
    		state: "KS",
    		pop: 4033
    	},
    	{
    		county: "Miami County",
    		state: "KS",
    		pop: 34237
    	},
    	{
    		county: "Mitchell County",
    		state: "KS",
    		pop: 5979
    	},
    	{
    		county: "Montgomery County",
    		state: "KS",
    		pop: 31829
    	},
    	{
    		county: "Morris County",
    		state: "KS",
    		pop: 5620
    	},
    	{
    		county: "Morton County",
    		state: "KS",
    		pop: 2587
    	},
    	{
    		county: "Nemaha County",
    		state: "KS",
    		pop: 10231
    	},
    	{
    		county: "Neosho County",
    		state: "KS",
    		pop: 16007
    	},
    	{
    		county: "Ness County",
    		state: "KS",
    		pop: 2750
    	},
    	{
    		county: "Norton County",
    		state: "KS",
    		pop: 5361
    	},
    	{
    		county: "Osage County",
    		state: "KS",
    		pop: 15949
    	},
    	{
    		county: "Osborne County",
    		state: "KS",
    		pop: 3421
    	},
    	{
    		county: "Ottawa County",
    		state: "KS",
    		pop: 5704
    	},
    	{
    		county: "Pawnee County",
    		state: "KS",
    		pop: 6414
    	},
    	{
    		county: "Phillips County",
    		state: "KS",
    		pop: 5234
    	},
    	{
    		county: "Pottawatomie County",
    		state: "KS",
    		pop: 24383
    	},
    	{
    		county: "Pratt County",
    		state: "KS",
    		pop: 9164
    	},
    	{
    		county: "Rawlins County",
    		state: "KS",
    		pop: 2530
    	},
    	{
    		county: "Reno County",
    		state: "KS",
    		pop: 61998
    	},
    	{
    		county: "Republic County",
    		state: "KS",
    		pop: 4636
    	},
    	{
    		county: "Rice County",
    		state: "KS",
    		pop: 9537
    	},
    	{
    		county: "Riley County",
    		state: "KS",
    		pop: 74232
    	},
    	{
    		county: "Rooks County",
    		state: "KS",
    		pop: 4920
    	},
    	{
    		county: "Rush County",
    		state: "KS",
    		pop: 3036
    	},
    	{
    		county: "Russell County",
    		state: "KS",
    		pop: 6856
    	},
    	{
    		county: "Saline County",
    		state: "KS",
    		pop: 54224
    	},
    	{
    		county: "Scott County",
    		state: "KS",
    		pop: 4823
    	},
    	{
    		county: "Sedgwick County",
    		state: "KS",
    		pop: 516042
    	},
    	{
    		county: "Seward County",
    		state: "KS",
    		pop: 21428
    	},
    	{
    		county: "Shawnee County",
    		state: "KS",
    		pop: 176875
    	},
    	{
    		county: "Sheridan County",
    		state: "KS",
    		pop: 2521
    	},
    	{
    		county: "Sherman County",
    		state: "KS",
    		pop: 5917
    	},
    	{
    		county: "Smith County",
    		state: "KS",
    		pop: 3583
    	},
    	{
    		county: "Stafford County",
    		state: "KS",
    		pop: 4156
    	},
    	{
    		county: "Stanton County",
    		state: "KS",
    		pop: 2006
    	},
    	{
    		county: "Stevens County",
    		state: "KS",
    		pop: 5485
    	},
    	{
    		county: "Sumner County",
    		state: "KS",
    		pop: 22836
    	},
    	{
    		county: "Thomas County",
    		state: "KS",
    		pop: 7777
    	},
    	{
    		county: "Trego County",
    		state: "KS",
    		pop: 2803
    	},
    	{
    		county: "Wabaunsee County",
    		state: "KS",
    		pop: 6931
    	},
    	{
    		county: "Wallace County",
    		state: "KS",
    		pop: 1518
    	},
    	{
    		county: "Washington County",
    		state: "KS",
    		pop: 5406
    	},
    	{
    		county: "Wichita County",
    		state: "KS",
    		pop: 2119
    	},
    	{
    		county: "Wilson County",
    		state: "KS",
    		pop: 8525
    	},
    	{
    		county: "Woodson County",
    		state: "KS",
    		pop: 3138
    	},
    	{
    		county: "Wyandotte County",
    		state: "KS",
    		pop: 165429
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "KY",
    		pop: 0
    	},
    	{
    		county: "Adair County",
    		state: "KY",
    		pop: 19202
    	},
    	{
    		county: "Allen County",
    		state: "KY",
    		pop: 21315
    	},
    	{
    		county: "Anderson County",
    		state: "KY",
    		pop: 22747
    	},
    	{
    		county: "Ballard County",
    		state: "KY",
    		pop: 7888
    	},
    	{
    		county: "Barren County",
    		state: "KY",
    		pop: 44249
    	},
    	{
    		county: "Bath County",
    		state: "KY",
    		pop: 12500
    	},
    	{
    		county: "Bell County",
    		state: "KY",
    		pop: 26032
    	},
    	{
    		county: "Boone County",
    		state: "KY",
    		pop: 133581
    	},
    	{
    		county: "Bourbon County",
    		state: "KY",
    		pop: 19788
    	},
    	{
    		county: "Boyd County",
    		state: "KY",
    		pop: 46718
    	},
    	{
    		county: "Boyle County",
    		state: "KY",
    		pop: 30060
    	},
    	{
    		county: "Bracken County",
    		state: "KY",
    		pop: 8303
    	},
    	{
    		county: "Breathitt County",
    		state: "KY",
    		pop: 12630
    	},
    	{
    		county: "Breckinridge County",
    		state: "KY",
    		pop: 20477
    	},
    	{
    		county: "Bullitt County",
    		state: "KY",
    		pop: 81676
    	},
    	{
    		county: "Butler County",
    		state: "KY",
    		pop: 12879
    	},
    	{
    		county: "Caldwell County",
    		state: "KY",
    		pop: 12747
    	},
    	{
    		county: "Calloway County",
    		state: "KY",
    		pop: 39001
    	},
    	{
    		county: "Campbell County",
    		state: "KY",
    		pop: 93584
    	},
    	{
    		county: "Carlisle County",
    		state: "KY",
    		pop: 4760
    	},
    	{
    		county: "Carroll County",
    		state: "KY",
    		pop: 10631
    	},
    	{
    		county: "Carter County",
    		state: "KY",
    		pop: 26797
    	},
    	{
    		county: "Casey County",
    		state: "KY",
    		pop: 16159
    	},
    	{
    		county: "Christian County",
    		state: "KY",
    		pop: 70461
    	},
    	{
    		county: "Clark County",
    		state: "KY",
    		pop: 36263
    	},
    	{
    		county: "Clay County",
    		state: "KY",
    		pop: 19901
    	},
    	{
    		county: "Clinton County",
    		state: "KY",
    		pop: 10218
    	},
    	{
    		county: "Crittenden County",
    		state: "KY",
    		pop: 8806
    	},
    	{
    		county: "Cumberland County",
    		state: "KY",
    		pop: 6614
    	},
    	{
    		county: "Daviess County",
    		state: "KY",
    		pop: 101511
    	},
    	{
    		county: "Edmonson County",
    		state: "KY",
    		pop: 12150
    	},
    	{
    		county: "Elliott County",
    		state: "KY",
    		pop: 7517
    	},
    	{
    		county: "Estill County",
    		state: "KY",
    		pop: 14106
    	},
    	{
    		county: "Fayette County",
    		state: "KY",
    		pop: 323152
    	},
    	{
    		county: "Fleming County",
    		state: "KY",
    		pop: 14581
    	},
    	{
    		county: "Floyd County",
    		state: "KY",
    		pop: 35589
    	},
    	{
    		county: "Franklin County",
    		state: "KY",
    		pop: 50991
    	},
    	{
    		county: "Fulton County",
    		state: "KY",
    		pop: 5969
    	},
    	{
    		county: "Gallatin County",
    		state: "KY",
    		pop: 8869
    	},
    	{
    		county: "Garrard County",
    		state: "KY",
    		pop: 17666
    	},
    	{
    		county: "Grant County",
    		state: "KY",
    		pop: 25069
    	},
    	{
    		county: "Graves County",
    		state: "KY",
    		pop: 37266
    	},
    	{
    		county: "Grayson County",
    		state: "KY",
    		pop: 26427
    	},
    	{
    		county: "Green County",
    		state: "KY",
    		pop: 10941
    	},
    	{
    		county: "Greenup County",
    		state: "KY",
    		pop: 35098
    	},
    	{
    		county: "Hancock County",
    		state: "KY",
    		pop: 8722
    	},
    	{
    		county: "Hardin County",
    		state: "KY",
    		pop: 110958
    	},
    	{
    		county: "Harlan County",
    		state: "KY",
    		pop: 26010
    	},
    	{
    		county: "Harrison County",
    		state: "KY",
    		pop: 18886
    	},
    	{
    		county: "Hart County",
    		state: "KY",
    		pop: 19035
    	},
    	{
    		county: "Henderson County",
    		state: "KY",
    		pop: 45210
    	},
    	{
    		county: "Henry County",
    		state: "KY",
    		pop: 16126
    	},
    	{
    		county: "Hickman County",
    		state: "KY",
    		pop: 4380
    	},
    	{
    		county: "Hopkins County",
    		state: "KY",
    		pop: 44686
    	},
    	{
    		county: "Jackson County",
    		state: "KY",
    		pop: 13329
    	},
    	{
    		county: "Jefferson County",
    		state: "KY",
    		pop: 766757
    	},
    	{
    		county: "Jessamine County",
    		state: "KY",
    		pop: 54115
    	},
    	{
    		county: "Johnson County",
    		state: "KY",
    		pop: 22188
    	},
    	{
    		county: "Kenton County",
    		state: "KY",
    		pop: 166998
    	},
    	{
    		county: "Knott County",
    		state: "KY",
    		pop: 14806
    	},
    	{
    		county: "Knox County",
    		state: "KY",
    		pop: 31145
    	},
    	{
    		county: "Larue County",
    		state: "KY",
    		pop: 14398
    	},
    	{
    		county: "Laurel County",
    		state: "KY",
    		pop: 60813
    	},
    	{
    		county: "Lawrence County",
    		state: "KY",
    		pop: 15317
    	},
    	{
    		county: "Lee County",
    		state: "KY",
    		pop: 7403
    	},
    	{
    		county: "Leslie County",
    		state: "KY",
    		pop: 9877
    	},
    	{
    		county: "Letcher County",
    		state: "KY",
    		pop: 21553
    	},
    	{
    		county: "Lewis County",
    		state: "KY",
    		pop: 13275
    	},
    	{
    		county: "Lincoln County",
    		state: "KY",
    		pop: 24549
    	},
    	{
    		county: "Livingston County",
    		state: "KY",
    		pop: 9194
    	},
    	{
    		county: "Logan County",
    		state: "KY",
    		pop: 27102
    	},
    	{
    		county: "Lyon County",
    		state: "KY",
    		pop: 8210
    	},
    	{
    		county: "McCracken County",
    		state: "KY",
    		pop: 65418
    	},
    	{
    		county: "McCreary County",
    		state: "KY",
    		pop: 17231
    	},
    	{
    		county: "McLean County",
    		state: "KY",
    		pop: 9207
    	},
    	{
    		county: "Madison County",
    		state: "KY",
    		pop: 92987
    	},
    	{
    		county: "Magoffin County",
    		state: "KY",
    		pop: 12161
    	},
    	{
    		county: "Marion County",
    		state: "KY",
    		pop: 19273
    	},
    	{
    		county: "Marshall County",
    		state: "KY",
    		pop: 31100
    	},
    	{
    		county: "Martin County",
    		state: "KY",
    		pop: 11195
    	},
    	{
    		county: "Mason County",
    		state: "KY",
    		pop: 17070
    	},
    	{
    		county: "Meade County",
    		state: "KY",
    		pop: 28572
    	},
    	{
    		county: "Menifee County",
    		state: "KY",
    		pop: 6489
    	},
    	{
    		county: "Mercer County",
    		state: "KY",
    		pop: 21933
    	},
    	{
    		county: "Metcalfe County",
    		state: "KY",
    		pop: 10071
    	},
    	{
    		county: "Monroe County",
    		state: "KY",
    		pop: 10650
    	},
    	{
    		county: "Montgomery County",
    		state: "KY",
    		pop: 28157
    	},
    	{
    		county: "Morgan County",
    		state: "KY",
    		pop: 13309
    	},
    	{
    		county: "Muhlenberg County",
    		state: "KY",
    		pop: 30622
    	},
    	{
    		county: "Nelson County",
    		state: "KY",
    		pop: 46233
    	},
    	{
    		county: "Nicholas County",
    		state: "KY",
    		pop: 7269
    	},
    	{
    		county: "Ohio County",
    		state: "KY",
    		pop: 23994
    	},
    	{
    		county: "Oldham County",
    		state: "KY",
    		pop: 66799
    	},
    	{
    		county: "Owen County",
    		state: "KY",
    		pop: 10901
    	},
    	{
    		county: "Owsley County",
    		state: "KY",
    		pop: 4415
    	},
    	{
    		county: "Pendleton County",
    		state: "KY",
    		pop: 14590
    	},
    	{
    		county: "Perry County",
    		state: "KY",
    		pop: 25758
    	},
    	{
    		county: "Pike County",
    		state: "KY",
    		pop: 57876
    	},
    	{
    		county: "Powell County",
    		state: "KY",
    		pop: 12359
    	},
    	{
    		county: "Pulaski County",
    		state: "KY",
    		pop: 64979
    	},
    	{
    		county: "Robertson County",
    		state: "KY",
    		pop: 2108
    	},
    	{
    		county: "Rockcastle County",
    		state: "KY",
    		pop: 16695
    	},
    	{
    		county: "Rowan County",
    		state: "KY",
    		pop: 24460
    	},
    	{
    		county: "Russell County",
    		state: "KY",
    		pop: 17923
    	},
    	{
    		county: "Scott County",
    		state: "KY",
    		pop: 57004
    	},
    	{
    		county: "Shelby County",
    		state: "KY",
    		pop: 49024
    	},
    	{
    		county: "Simpson County",
    		state: "KY",
    		pop: 18572
    	},
    	{
    		county: "Spencer County",
    		state: "KY",
    		pop: 19351
    	},
    	{
    		county: "Taylor County",
    		state: "KY",
    		pop: 25769
    	},
    	{
    		county: "Todd County",
    		state: "KY",
    		pop: 12294
    	},
    	{
    		county: "Trigg County",
    		state: "KY",
    		pop: 14651
    	},
    	{
    		county: "Trimble County",
    		state: "KY",
    		pop: 8471
    	},
    	{
    		county: "Union County",
    		state: "KY",
    		pop: 14381
    	},
    	{
    		county: "Warren County",
    		state: "KY",
    		pop: 132896
    	},
    	{
    		county: "Washington County",
    		state: "KY",
    		pop: 12095
    	},
    	{
    		county: "Wayne County",
    		state: "KY",
    		pop: 20333
    	},
    	{
    		county: "Webster County",
    		state: "KY",
    		pop: 12942
    	},
    	{
    		county: "Whitley County",
    		state: "KY",
    		pop: 36264
    	},
    	{
    		county: "Wolfe County",
    		state: "KY",
    		pop: 7157
    	},
    	{
    		county: "Woodford County",
    		state: "KY",
    		pop: 26734
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "LA",
    		pop: 0
    	},
    	{
    		county: "Acadia Parish",
    		state: "LA",
    		pop: 62045
    	},
    	{
    		county: "Allen Parish",
    		state: "LA",
    		pop: 25627
    	},
    	{
    		county: "Ascension Parish",
    		state: "LA",
    		pop: 126604
    	},
    	{
    		county: "Assumption Parish",
    		state: "LA",
    		pop: 21891
    	},
    	{
    		county: "Avoyelles Parish",
    		state: "LA",
    		pop: 40144
    	},
    	{
    		county: "Beauregard Parish",
    		state: "LA",
    		pop: 37497
    	},
    	{
    		county: "Bienville Parish",
    		state: "LA",
    		pop: 13241
    	},
    	{
    		county: "Bossier Parish",
    		state: "LA",
    		pop: 127039
    	},
    	{
    		county: "Caddo Parish",
    		state: "LA",
    		pop: 240204
    	},
    	{
    		county: "Calcasieu Parish",
    		state: "LA",
    		pop: 203436
    	},
    	{
    		county: "Caldwell Parish",
    		state: "LA",
    		pop: 9918
    	},
    	{
    		county: "Cameron Parish",
    		state: "LA",
    		pop: 6973
    	},
    	{
    		county: "Catahoula Parish",
    		state: "LA",
    		pop: 9494
    	},
    	{
    		county: "Claiborne Parish",
    		state: "LA",
    		pop: 15670
    	},
    	{
    		county: "Concordia Parish",
    		state: "LA",
    		pop: 19259
    	},
    	{
    		county: "De Soto Parish",
    		state: "LA",
    		pop: 27463
    	},
    	{
    		county: "East Baton Rouge Parish",
    		state: "LA",
    		pop: 440059
    	},
    	{
    		county: "East Carroll Parish",
    		state: "LA",
    		pop: 6861
    	},
    	{
    		county: "East Feliciana Parish",
    		state: "LA",
    		pop: 19135
    	},
    	{
    		county: "Evangeline Parish",
    		state: "LA",
    		pop: 33395
    	},
    	{
    		county: "Franklin Parish",
    		state: "LA",
    		pop: 20015
    	},
    	{
    		county: "Grant Parish",
    		state: "LA",
    		pop: 22389
    	},
    	{
    		county: "Iberia Parish",
    		state: "LA",
    		pop: 69830
    	},
    	{
    		county: "Iberville Parish",
    		state: "LA",
    		pop: 32511
    	},
    	{
    		county: "Jackson Parish",
    		state: "LA",
    		pop: 15744
    	},
    	{
    		county: "Jefferson Parish",
    		state: "LA",
    		pop: 432493
    	},
    	{
    		county: "Jefferson Davis Parish",
    		state: "LA",
    		pop: 31368
    	},
    	{
    		county: "Lafayette Parish",
    		state: "LA",
    		pop: 244390
    	},
    	{
    		county: "Lafourche Parish",
    		state: "LA",
    		pop: 97614
    	},
    	{
    		county: "La Salle Parish",
    		state: "LA",
    		pop: 14892
    	},
    	{
    		county: "Lincoln Parish",
    		state: "LA",
    		pop: 46742
    	},
    	{
    		county: "Livingston Parish",
    		state: "LA",
    		pop: 140789
    	},
    	{
    		county: "Madison Parish",
    		state: "LA",
    		pop: 10951
    	},
    	{
    		county: "Morehouse Parish",
    		state: "LA",
    		pop: 24874
    	},
    	{
    		county: "Natchitoches Parish",
    		state: "LA",
    		pop: 38158
    	},
    	{
    		county: "Orleans Parish",
    		state: "LA",
    		pop: 390144
    	},
    	{
    		county: "Ouachita Parish",
    		state: "LA",
    		pop: 153279
    	},
    	{
    		county: "Plaquemines Parish",
    		state: "LA",
    		pop: 23197
    	},
    	{
    		county: "Pointe Coupee Parish",
    		state: "LA",
    		pop: 21730
    	},
    	{
    		county: "Rapides Parish",
    		state: "LA",
    		pop: 129648
    	},
    	{
    		county: "Red River Parish",
    		state: "LA",
    		pop: 8442
    	},
    	{
    		county: "Richland Parish",
    		state: "LA",
    		pop: 20122
    	},
    	{
    		county: "Sabine Parish",
    		state: "LA",
    		pop: 23884
    	},
    	{
    		county: "St. Bernard Parish",
    		state: "LA",
    		pop: 47244
    	},
    	{
    		county: "St. Charles Parish",
    		state: "LA",
    		pop: 53100
    	},
    	{
    		county: "St. Helena Parish",
    		state: "LA",
    		pop: 10132
    	},
    	{
    		county: "St. James Parish",
    		state: "LA",
    		pop: 21096
    	},
    	{
    		county: "St. John the Baptist Parish",
    		state: "LA",
    		pop: 42837
    	},
    	{
    		county: "St. Landry Parish",
    		state: "LA",
    		pop: 82124
    	},
    	{
    		county: "St. Martin Parish",
    		state: "LA",
    		pop: 53431
    	},
    	{
    		county: "St. Mary Parish",
    		state: "LA",
    		pop: 49348
    	},
    	{
    		county: "St. Tammany Parish",
    		state: "LA",
    		pop: 260419
    	},
    	{
    		county: "Tangipahoa Parish",
    		state: "LA",
    		pop: 134758
    	},
    	{
    		county: "Tensas Parish",
    		state: "LA",
    		pop: 4334
    	},
    	{
    		county: "Terrebonne Parish",
    		state: "LA",
    		pop: 110461
    	},
    	{
    		county: "Union Parish",
    		state: "LA",
    		pop: 22108
    	},
    	{
    		county: "Vermilion Parish",
    		state: "LA",
    		pop: 59511
    	},
    	{
    		county: "Vernon Parish",
    		state: "LA",
    		pop: 47429
    	},
    	{
    		county: "Washington Parish",
    		state: "LA",
    		pop: 46194
    	},
    	{
    		county: "Webster Parish",
    		state: "LA",
    		pop: 38340
    	},
    	{
    		county: "West Baton Rouge Parish",
    		state: "LA",
    		pop: 26465
    	},
    	{
    		county: "West Carroll Parish",
    		state: "LA",
    		pop: 10830
    	},
    	{
    		county: "West Feliciana Parish",
    		state: "LA",
    		pop: 15568
    	},
    	{
    		county: "Winn Parish",
    		state: "LA",
    		pop: 13904
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "ME",
    		pop: 0
    	},
    	{
    		county: "Androscoggin County",
    		state: "ME",
    		pop: 108277
    	},
    	{
    		county: "Aroostook County",
    		state: "ME",
    		pop: 67055
    	},
    	{
    		county: "Cumberland County",
    		state: "ME",
    		pop: 295003
    	},
    	{
    		county: "Franklin County",
    		state: "ME",
    		pop: 30199
    	},
    	{
    		county: "Hancock County",
    		state: "ME",
    		pop: 54987
    	},
    	{
    		county: "Kennebec County",
    		state: "ME",
    		pop: 122302
    	},
    	{
    		county: "Knox County",
    		state: "ME",
    		pop: 39772
    	},
    	{
    		county: "Lincoln County",
    		state: "ME",
    		pop: 34634
    	},
    	{
    		county: "Oxford County",
    		state: "ME",
    		pop: 57975
    	},
    	{
    		county: "Penobscot County",
    		state: "ME",
    		pop: 152148
    	},
    	{
    		county: "Piscataquis County",
    		state: "ME",
    		pop: 16785
    	},
    	{
    		county: "Sagadahoc County",
    		state: "ME",
    		pop: 35856
    	},
    	{
    		county: "Somerset County",
    		state: "ME",
    		pop: 50484
    	},
    	{
    		county: "Waldo County",
    		state: "ME",
    		pop: 39715
    	},
    	{
    		county: "Washington County",
    		state: "ME",
    		pop: 31379
    	},
    	{
    		county: "York County",
    		state: "ME",
    		pop: 207641
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "MD",
    		pop: 0
    	},
    	{
    		county: "Allegany County",
    		state: "MD",
    		pop: 70416
    	},
    	{
    		county: "Anne Arundel County",
    		state: "MD",
    		pop: 579234
    	},
    	{
    		county: "Baltimore County",
    		state: "MD",
    		pop: 827370
    	},
    	{
    		county: "Calvert County",
    		state: "MD",
    		pop: 92525
    	},
    	{
    		county: "Caroline County",
    		state: "MD",
    		pop: 33406
    	},
    	{
    		county: "Carroll County",
    		state: "MD",
    		pop: 168447
    	},
    	{
    		county: "Cecil County",
    		state: "MD",
    		pop: 102855
    	},
    	{
    		county: "Charles County",
    		state: "MD",
    		pop: 163257
    	},
    	{
    		county: "Dorchester County",
    		state: "MD",
    		pop: 31929
    	},
    	{
    		county: "Frederick County",
    		state: "MD",
    		pop: 259547
    	},
    	{
    		county: "Garrett County",
    		state: "MD",
    		pop: 29014
    	},
    	{
    		county: "Harford County",
    		state: "MD",
    		pop: 255441
    	},
    	{
    		county: "Howard County",
    		state: "MD",
    		pop: 325690
    	},
    	{
    		county: "Kent County",
    		state: "MD",
    		pop: 19422
    	},
    	{
    		county: "Montgomery County",
    		state: "MD",
    		pop: 1050688
    	},
    	{
    		county: "Prince George's County",
    		state: "MD",
    		pop: 909327
    	},
    	{
    		county: "Queen Anne's County",
    		state: "MD",
    		pop: 50381
    	},
    	{
    		county: "St. Mary's County",
    		state: "MD",
    		pop: 113510
    	},
    	{
    		county: "Somerset County",
    		state: "MD",
    		pop: 25616
    	},
    	{
    		county: "Talbot County",
    		state: "MD",
    		pop: 37181
    	},
    	{
    		county: "Washington County",
    		state: "MD",
    		pop: 151049
    	},
    	{
    		county: "Wicomico County",
    		state: "MD",
    		pop: 103609
    	},
    	{
    		county: "Worcester County",
    		state: "MD",
    		pop: 52276
    	},
    	{
    		county: "Baltimore City",
    		state: "MD",
    		pop: 593490
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "MA",
    		pop: 0
    	},
    	{
    		county: "Barnstable County",
    		state: "MA",
    		pop: 212990
    	},
    	{
    		county: "Berkshire County",
    		state: "MA",
    		pop: 124944
    	},
    	{
    		county: "Bristol County",
    		state: "MA",
    		pop: 565217
    	},
    	{
    		county: "Dukes County",
    		state: "MA",
    		pop: 17332
    	},
    	{
    		county: "Essex County",
    		state: "MA",
    		pop: 789034
    	},
    	{
    		county: "Franklin County",
    		state: "MA",
    		pop: 70180
    	},
    	{
    		county: "Hampden County",
    		state: "MA",
    		pop: 466372
    	},
    	{
    		county: "Hampshire County",
    		state: "MA",
    		pop: 160830
    	},
    	{
    		county: "Middlesex County",
    		state: "MA",
    		pop: 1611699
    	},
    	{
    		county: "Nantucket County",
    		state: "MA",
    		pop: 11399
    	},
    	{
    		county: "Norfolk County",
    		state: "MA",
    		pop: 706775
    	},
    	{
    		county: "Plymouth County",
    		state: "MA",
    		pop: 521202
    	},
    	{
    		county: "Suffolk County",
    		state: "MA",
    		pop: 803907
    	},
    	{
    		county: "Worcester County",
    		state: "MA",
    		pop: 830622
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "MI",
    		pop: 0
    	},
    	{
    		county: "Alcona County",
    		state: "MI",
    		pop: 10405
    	},
    	{
    		county: "Alger County",
    		state: "MI",
    		pop: 9108
    	},
    	{
    		county: "Allegan County",
    		state: "MI",
    		pop: 118081
    	},
    	{
    		county: "Alpena County",
    		state: "MI",
    		pop: 28405
    	},
    	{
    		county: "Antrim County",
    		state: "MI",
    		pop: 23324
    	},
    	{
    		county: "Arenac County",
    		state: "MI",
    		pop: 14883
    	},
    	{
    		county: "Baraga County",
    		state: "MI",
    		pop: 8209
    	},
    	{
    		county: "Barry County",
    		state: "MI",
    		pop: 61550
    	},
    	{
    		county: "Bay County",
    		state: "MI",
    		pop: 103126
    	},
    	{
    		county: "Benzie County",
    		state: "MI",
    		pop: 17766
    	},
    	{
    		county: "Berrien County",
    		state: "MI",
    		pop: 153401
    	},
    	{
    		county: "Branch County",
    		state: "MI",
    		pop: 43517
    	},
    	{
    		county: "Calhoun County",
    		state: "MI",
    		pop: 134159
    	},
    	{
    		county: "Cass County",
    		state: "MI",
    		pop: 51787
    	},
    	{
    		county: "Charlevoix County",
    		state: "MI",
    		pop: 26143
    	},
    	{
    		county: "Cheboygan County",
    		state: "MI",
    		pop: 25276
    	},
    	{
    		county: "Chippewa County",
    		state: "MI",
    		pop: 37349
    	},
    	{
    		county: "Clare County",
    		state: "MI",
    		pop: 30950
    	},
    	{
    		county: "Clinton County",
    		state: "MI",
    		pop: 79595
    	},
    	{
    		county: "Crawford County",
    		state: "MI",
    		pop: 14029
    	},
    	{
    		county: "Delta County",
    		state: "MI",
    		pop: 35784
    	},
    	{
    		county: "Dickinson County",
    		state: "MI",
    		pop: 25239
    	},
    	{
    		county: "Eaton County",
    		state: "MI",
    		pop: 110268
    	},
    	{
    		county: "Emmet County",
    		state: "MI",
    		pop: 33415
    	},
    	{
    		county: "Genesee County",
    		state: "MI",
    		pop: 405813
    	},
    	{
    		county: "Gladwin County",
    		state: "MI",
    		pop: 25449
    	},
    	{
    		county: "Gogebic County",
    		state: "MI",
    		pop: 13975
    	},
    	{
    		county: "Grand Traverse County",
    		state: "MI",
    		pop: 93088
    	},
    	{
    		county: "Gratiot County",
    		state: "MI",
    		pop: 40711
    	},
    	{
    		county: "Hillsdale County",
    		state: "MI",
    		pop: 45605
    	},
    	{
    		county: "Houghton County",
    		state: "MI",
    		pop: 35684
    	},
    	{
    		county: "Huron County",
    		state: "MI",
    		pop: 30981
    	},
    	{
    		county: "Ingham County",
    		state: "MI",
    		pop: 292406
    	},
    	{
    		county: "Ionia County",
    		state: "MI",
    		pop: 64697
    	},
    	{
    		county: "Iosco County",
    		state: "MI",
    		pop: 25127
    	},
    	{
    		county: "Iron County",
    		state: "MI",
    		pop: 11066
    	},
    	{
    		county: "Isabella County",
    		state: "MI",
    		pop: 69872
    	},
    	{
    		county: "Jackson County",
    		state: "MI",
    		pop: 158510
    	},
    	{
    		county: "Kalamazoo County",
    		state: "MI",
    		pop: 265066
    	},
    	{
    		county: "Kalkaska County",
    		state: "MI",
    		pop: 18038
    	},
    	{
    		county: "Kent County",
    		state: "MI",
    		pop: 656955
    	},
    	{
    		county: "Keweenaw County",
    		state: "MI",
    		pop: 2116
    	},
    	{
    		county: "Lake County",
    		state: "MI",
    		pop: 11853
    	},
    	{
    		county: "Lapeer County",
    		state: "MI",
    		pop: 87607
    	},
    	{
    		county: "Leelanau County",
    		state: "MI",
    		pop: 21761
    	},
    	{
    		county: "Lenawee County",
    		state: "MI",
    		pop: 98451
    	},
    	{
    		county: "Livingston County",
    		state: "MI",
    		pop: 191995
    	},
    	{
    		county: "Luce County",
    		state: "MI",
    		pop: 6229
    	},
    	{
    		county: "Mackinac County",
    		state: "MI",
    		pop: 10799
    	},
    	{
    		county: "Macomb County",
    		state: "MI",
    		pop: 873972
    	},
    	{
    		county: "Manistee County",
    		state: "MI",
    		pop: 24558
    	},
    	{
    		county: "Marquette County",
    		state: "MI",
    		pop: 66699
    	},
    	{
    		county: "Mason County",
    		state: "MI",
    		pop: 29144
    	},
    	{
    		county: "Mecosta County",
    		state: "MI",
    		pop: 43453
    	},
    	{
    		county: "Menominee County",
    		state: "MI",
    		pop: 22780
    	},
    	{
    		county: "Midland County",
    		state: "MI",
    		pop: 83156
    	},
    	{
    		county: "Missaukee County",
    		state: "MI",
    		pop: 15118
    	},
    	{
    		county: "Monroe County",
    		state: "MI",
    		pop: 150500
    	},
    	{
    		county: "Montcalm County",
    		state: "MI",
    		pop: 63888
    	},
    	{
    		county: "Montmorency County",
    		state: "MI",
    		pop: 9328
    	},
    	{
    		county: "Muskegon County",
    		state: "MI",
    		pop: 173566
    	},
    	{
    		county: "Newaygo County",
    		state: "MI",
    		pop: 48980
    	},
    	{
    		county: "Oakland County",
    		state: "MI",
    		pop: 1257584
    	},
    	{
    		county: "Oceana County",
    		state: "MI",
    		pop: 26467
    	},
    	{
    		county: "Ogemaw County",
    		state: "MI",
    		pop: 20997
    	},
    	{
    		county: "Ontonagon County",
    		state: "MI",
    		pop: 5720
    	},
    	{
    		county: "Osceola County",
    		state: "MI",
    		pop: 23460
    	},
    	{
    		county: "Oscoda County",
    		state: "MI",
    		pop: 8241
    	},
    	{
    		county: "Otsego County",
    		state: "MI",
    		pop: 24668
    	},
    	{
    		county: "Ottawa County",
    		state: "MI",
    		pop: 291830
    	},
    	{
    		county: "Presque Isle County",
    		state: "MI",
    		pop: 12592
    	},
    	{
    		county: "Roscommon County",
    		state: "MI",
    		pop: 24019
    	},
    	{
    		county: "Saginaw County",
    		state: "MI",
    		pop: 190539
    	},
    	{
    		county: "St. Clair County",
    		state: "MI",
    		pop: 159128
    	},
    	{
    		county: "St. Joseph County",
    		state: "MI",
    		pop: 60964
    	},
    	{
    		county: "Sanilac County",
    		state: "MI",
    		pop: 41170
    	},
    	{
    		county: "Schoolcraft County",
    		state: "MI",
    		pop: 8094
    	},
    	{
    		county: "Shiawassee County",
    		state: "MI",
    		pop: 68122
    	},
    	{
    		county: "Tuscola County",
    		state: "MI",
    		pop: 52245
    	},
    	{
    		county: "Van Buren County",
    		state: "MI",
    		pop: 75677
    	},
    	{
    		county: "Washtenaw County",
    		state: "MI",
    		pop: 367601
    	},
    	{
    		county: "Wayne County",
    		state: "MI",
    		pop: 1749343
    	},
    	{
    		county: "Wexford County",
    		state: "MI",
    		pop: 33631
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "MN",
    		pop: 0
    	},
    	{
    		county: "Aitkin County",
    		state: "MN",
    		pop: 15886
    	},
    	{
    		county: "Anoka County",
    		state: "MN",
    		pop: 356921
    	},
    	{
    		county: "Becker County",
    		state: "MN",
    		pop: 34423
    	},
    	{
    		county: "Beltrami County",
    		state: "MN",
    		pop: 47188
    	},
    	{
    		county: "Benton County",
    		state: "MN",
    		pop: 40889
    	},
    	{
    		county: "Big Stone County",
    		state: "MN",
    		pop: 4991
    	},
    	{
    		county: "Blue Earth County",
    		state: "MN",
    		pop: 67653
    	},
    	{
    		county: "Brown County",
    		state: "MN",
    		pop: 25008
    	},
    	{
    		county: "Carlton County",
    		state: "MN",
    		pop: 35871
    	},
    	{
    		county: "Carver County",
    		state: "MN",
    		pop: 105089
    	},
    	{
    		county: "Cass County",
    		state: "MN",
    		pop: 29779
    	},
    	{
    		county: "Chippewa County",
    		state: "MN",
    		pop: 11800
    	},
    	{
    		county: "Chisago County",
    		state: "MN",
    		pop: 56579
    	},
    	{
    		county: "Clay County",
    		state: "MN",
    		pop: 64222
    	},
    	{
    		county: "Clearwater County",
    		state: "MN",
    		pop: 8818
    	},
    	{
    		county: "Cook County",
    		state: "MN",
    		pop: 5463
    	},
    	{
    		county: "Cottonwood County",
    		state: "MN",
    		pop: 11196
    	},
    	{
    		county: "Crow Wing County",
    		state: "MN",
    		pop: 65055
    	},
    	{
    		county: "Dakota County",
    		state: "MN",
    		pop: 429021
    	},
    	{
    		county: "Dodge County",
    		state: "MN",
    		pop: 20934
    	},
    	{
    		county: "Douglas County",
    		state: "MN",
    		pop: 38141
    	},
    	{
    		county: "Faribault County",
    		state: "MN",
    		pop: 13653
    	},
    	{
    		county: "Fillmore County",
    		state: "MN",
    		pop: 21067
    	},
    	{
    		county: "Freeborn County",
    		state: "MN",
    		pop: 30281
    	},
    	{
    		county: "Goodhue County",
    		state: "MN",
    		pop: 46340
    	},
    	{
    		county: "Grant County",
    		state: "MN",
    		pop: 5972
    	},
    	{
    		county: "Hennepin County",
    		state: "MN",
    		pop: 1265843
    	},
    	{
    		county: "Houston County",
    		state: "MN",
    		pop: 18600
    	},
    	{
    		county: "Hubbard County",
    		state: "MN",
    		pop: 21491
    	},
    	{
    		county: "Isanti County",
    		state: "MN",
    		pop: 40596
    	},
    	{
    		county: "Itasca County",
    		state: "MN",
    		pop: 45130
    	},
    	{
    		county: "Jackson County",
    		state: "MN",
    		pop: 9846
    	},
    	{
    		county: "Kanabec County",
    		state: "MN",
    		pop: 16337
    	},
    	{
    		county: "Kandiyohi County",
    		state: "MN",
    		pop: 43199
    	},
    	{
    		county: "Kittson County",
    		state: "MN",
    		pop: 4298
    	},
    	{
    		county: "Koochiching County",
    		state: "MN",
    		pop: 12229
    	},
    	{
    		county: "Lac Qui Parle County",
    		state: "MN",
    		pop: 6623
    	},
    	{
    		county: "Lake County",
    		state: "MN",
    		pop: 10641
    	},
    	{
    		county: "Lake of the Woods County",
    		state: "MN",
    		pop: 3740
    	},
    	{
    		county: "Le Sueur County",
    		state: "MN",
    		pop: 28887
    	},
    	{
    		county: "Lincoln County",
    		state: "MN",
    		pop: 5639
    	},
    	{
    		county: "Lyon County",
    		state: "MN",
    		pop: 25474
    	},
    	{
    		county: "McLeod County",
    		state: "MN",
    		pop: 35893
    	},
    	{
    		county: "Mahnomen County",
    		state: "MN",
    		pop: 5527
    	},
    	{
    		county: "Marshall County",
    		state: "MN",
    		pop: 9336
    	},
    	{
    		county: "Martin County",
    		state: "MN",
    		pop: 19683
    	},
    	{
    		county: "Meeker County",
    		state: "MN",
    		pop: 23222
    	},
    	{
    		county: "Mille Lacs County",
    		state: "MN",
    		pop: 26277
    	},
    	{
    		county: "Morrison County",
    		state: "MN",
    		pop: 33386
    	},
    	{
    		county: "Mower County",
    		state: "MN",
    		pop: 40062
    	},
    	{
    		county: "Murray County",
    		state: "MN",
    		pop: 8194
    	},
    	{
    		county: "Nicollet County",
    		state: "MN",
    		pop: 34274
    	},
    	{
    		county: "Nobles County",
    		state: "MN",
    		pop: 21629
    	},
    	{
    		county: "Norman County",
    		state: "MN",
    		pop: 6375
    	},
    	{
    		county: "Olmsted County",
    		state: "MN",
    		pop: 158293
    	},
    	{
    		county: "Otter Tail County",
    		state: "MN",
    		pop: 58746
    	},
    	{
    		county: "Pennington County",
    		state: "MN",
    		pop: 14119
    	},
    	{
    		county: "Pine County",
    		state: "MN",
    		pop: 29579
    	},
    	{
    		county: "Pipestone County",
    		state: "MN",
    		pop: 9126
    	},
    	{
    		county: "Polk County",
    		state: "MN",
    		pop: 31364
    	},
    	{
    		county: "Pope County",
    		state: "MN",
    		pop: 11249
    	},
    	{
    		county: "Ramsey County",
    		state: "MN",
    		pop: 550321
    	},
    	{
    		county: "Red Lake County",
    		state: "MN",
    		pop: 4055
    	},
    	{
    		county: "Redwood County",
    		state: "MN",
    		pop: 15170
    	},
    	{
    		county: "Renville County",
    		state: "MN",
    		pop: 14548
    	},
    	{
    		county: "Rice County",
    		state: "MN",
    		pop: 66972
    	},
    	{
    		county: "Rock County",
    		state: "MN",
    		pop: 9315
    	},
    	{
    		county: "Roseau County",
    		state: "MN",
    		pop: 15165
    	},
    	{
    		county: "St. Louis County",
    		state: "MN",
    		pop: 199070
    	},
    	{
    		county: "Scott County",
    		state: "MN",
    		pop: 149013
    	},
    	{
    		county: "Sherburne County",
    		state: "MN",
    		pop: 97238
    	},
    	{
    		county: "Sibley County",
    		state: "MN",
    		pop: 14865
    	},
    	{
    		county: "Stearns County",
    		state: "MN",
    		pop: 161075
    	},
    	{
    		county: "Steele County",
    		state: "MN",
    		pop: 36649
    	},
    	{
    		county: "Stevens County",
    		state: "MN",
    		pop: 9805
    	},
    	{
    		county: "Swift County",
    		state: "MN",
    		pop: 9266
    	},
    	{
    		county: "Todd County",
    		state: "MN",
    		pop: 24664
    	},
    	{
    		county: "Traverse County",
    		state: "MN",
    		pop: 3259
    	},
    	{
    		county: "Wabasha County",
    		state: "MN",
    		pop: 21627
    	},
    	{
    		county: "Wadena County",
    		state: "MN",
    		pop: 13682
    	},
    	{
    		county: "Waseca County",
    		state: "MN",
    		pop: 18612
    	},
    	{
    		county: "Washington County",
    		state: "MN",
    		pop: 262440
    	},
    	{
    		county: "Watonwan County",
    		state: "MN",
    		pop: 10897
    	},
    	{
    		county: "Wilkin County",
    		state: "MN",
    		pop: 6207
    	},
    	{
    		county: "Winona County",
    		state: "MN",
    		pop: 50484
    	},
    	{
    		county: "Wright County",
    		state: "MN",
    		pop: 138377
    	},
    	{
    		county: "Yellow Medicine County",
    		state: "MN",
    		pop: 9709
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "MS",
    		pop: 0
    	},
    	{
    		county: "Adams County",
    		state: "MS",
    		pop: 30693
    	},
    	{
    		county: "Alcorn County",
    		state: "MS",
    		pop: 36953
    	},
    	{
    		county: "Amite County",
    		state: "MS",
    		pop: 12297
    	},
    	{
    		county: "Attala County",
    		state: "MS",
    		pop: 18174
    	},
    	{
    		county: "Benton County",
    		state: "MS",
    		pop: 8259
    	},
    	{
    		county: "Bolivar County",
    		state: "MS",
    		pop: 30628
    	},
    	{
    		county: "Calhoun County",
    		state: "MS",
    		pop: 14361
    	},
    	{
    		county: "Carroll County",
    		state: "MS",
    		pop: 9947
    	},
    	{
    		county: "Chickasaw County",
    		state: "MS",
    		pop: 17103
    	},
    	{
    		county: "Choctaw County",
    		state: "MS",
    		pop: 8210
    	},
    	{
    		county: "Claiborne County",
    		state: "MS",
    		pop: 8988
    	},
    	{
    		county: "Clarke County",
    		state: "MS",
    		pop: 15541
    	},
    	{
    		county: "Clay County",
    		state: "MS",
    		pop: 19316
    	},
    	{
    		county: "Coahoma County",
    		state: "MS",
    		pop: 22124
    	},
    	{
    		county: "Copiah County",
    		state: "MS",
    		pop: 28065
    	},
    	{
    		county: "Covington County",
    		state: "MS",
    		pop: 18636
    	},
    	{
    		county: "DeSoto County",
    		state: "MS",
    		pop: 184945
    	},
    	{
    		county: "Forrest County",
    		state: "MS",
    		pop: 74897
    	},
    	{
    		county: "Franklin County",
    		state: "MS",
    		pop: 7713
    	},
    	{
    		county: "George County",
    		state: "MS",
    		pop: 24500
    	},
    	{
    		county: "Greene County",
    		state: "MS",
    		pop: 13586
    	},
    	{
    		county: "Grenada County",
    		state: "MS",
    		pop: 20758
    	},
    	{
    		county: "Hancock County",
    		state: "MS",
    		pop: 47632
    	},
    	{
    		county: "Harrison County",
    		state: "MS",
    		pop: 208080
    	},
    	{
    		county: "Hinds County",
    		state: "MS",
    		pop: 231840
    	},
    	{
    		county: "Holmes County",
    		state: "MS",
    		pop: 17010
    	},
    	{
    		county: "Humphreys County",
    		state: "MS",
    		pop: 8064
    	},
    	{
    		county: "Issaquena County",
    		state: "MS",
    		pop: 1327
    	},
    	{
    		county: "Itawamba County",
    		state: "MS",
    		pop: 23390
    	},
    	{
    		county: "Jackson County",
    		state: "MS",
    		pop: 143617
    	},
    	{
    		county: "Jasper County",
    		state: "MS",
    		pop: 16383
    	},
    	{
    		county: "Jefferson County",
    		state: "MS",
    		pop: 6990
    	},
    	{
    		county: "Jefferson Davis County",
    		state: "MS",
    		pop: 11128
    	},
    	{
    		county: "Jones County",
    		state: "MS",
    		pop: 68098
    	},
    	{
    		county: "Kemper County",
    		state: "MS",
    		pop: 9742
    	},
    	{
    		county: "Lafayette County",
    		state: "MS",
    		pop: 54019
    	},
    	{
    		county: "Lamar County",
    		state: "MS",
    		pop: 63343
    	},
    	{
    		county: "Lauderdale County",
    		state: "MS",
    		pop: 74125
    	},
    	{
    		county: "Lawrence County",
    		state: "MS",
    		pop: 12586
    	},
    	{
    		county: "Leake County",
    		state: "MS",
    		pop: 22786
    	},
    	{
    		county: "Lee County",
    		state: "MS",
    		pop: 85436
    	},
    	{
    		county: "Leflore County",
    		state: "MS",
    		pop: 28183
    	},
    	{
    		county: "Lincoln County",
    		state: "MS",
    		pop: 34153
    	},
    	{
    		county: "Lowndes County",
    		state: "MS",
    		pop: 58595
    	},
    	{
    		county: "Madison County",
    		state: "MS",
    		pop: 106272
    	},
    	{
    		county: "Marion County",
    		state: "MS",
    		pop: 24573
    	},
    	{
    		county: "Marshall County",
    		state: "MS",
    		pop: 35294
    	},
    	{
    		county: "Monroe County",
    		state: "MS",
    		pop: 35252
    	},
    	{
    		county: "Montgomery County",
    		state: "MS",
    		pop: 9775
    	},
    	{
    		county: "Neshoba County",
    		state: "MS",
    		pop: 29118
    	},
    	{
    		county: "Newton County",
    		state: "MS",
    		pop: 21018
    	},
    	{
    		county: "Noxubee County",
    		state: "MS",
    		pop: 10417
    	},
    	{
    		county: "Oktibbeha County",
    		state: "MS",
    		pop: 49587
    	},
    	{
    		county: "Panola County",
    		state: "MS",
    		pop: 34192
    	},
    	{
    		county: "Pearl River County",
    		state: "MS",
    		pop: 55535
    	},
    	{
    		county: "Perry County",
    		state: "MS",
    		pop: 11973
    	},
    	{
    		county: "Pike County",
    		state: "MS",
    		pop: 39288
    	},
    	{
    		county: "Pontotoc County",
    		state: "MS",
    		pop: 32174
    	},
    	{
    		county: "Prentiss County",
    		state: "MS",
    		pop: 25126
    	},
    	{
    		county: "Quitman County",
    		state: "MS",
    		pop: 6792
    	},
    	{
    		county: "Rankin County",
    		state: "MS",
    		pop: 155271
    	},
    	{
    		county: "Scott County",
    		state: "MS",
    		pop: 28124
    	},
    	{
    		county: "Sharkey County",
    		state: "MS",
    		pop: 4321
    	},
    	{
    		county: "Simpson County",
    		state: "MS",
    		pop: 26658
    	},
    	{
    		county: "Smith County",
    		state: "MS",
    		pop: 15916
    	},
    	{
    		county: "Stone County",
    		state: "MS",
    		pop: 18336
    	},
    	{
    		county: "Sunflower County",
    		state: "MS",
    		pop: 25110
    	},
    	{
    		county: "Tallahatchie County",
    		state: "MS",
    		pop: 13809
    	},
    	{
    		county: "Tate County",
    		state: "MS",
    		pop: 28321
    	},
    	{
    		county: "Tippah County",
    		state: "MS",
    		pop: 22015
    	},
    	{
    		county: "Tishomingo County",
    		state: "MS",
    		pop: 19383
    	},
    	{
    		county: "Tunica County",
    		state: "MS",
    		pop: 9632
    	},
    	{
    		county: "Union County",
    		state: "MS",
    		pop: 28815
    	},
    	{
    		county: "Walthall County",
    		state: "MS",
    		pop: 14286
    	},
    	{
    		county: "Warren County",
    		state: "MS",
    		pop: 45381
    	},
    	{
    		county: "Washington County",
    		state: "MS",
    		pop: 43909
    	},
    	{
    		county: "Wayne County",
    		state: "MS",
    		pop: 20183
    	},
    	{
    		county: "Webster County",
    		state: "MS",
    		pop: 9689
    	},
    	{
    		county: "Wilkinson County",
    		state: "MS",
    		pop: 8630
    	},
    	{
    		county: "Winston County",
    		state: "MS",
    		pop: 17955
    	},
    	{
    		county: "Yalobusha County",
    		state: "MS",
    		pop: 12108
    	},
    	{
    		county: "Yazoo County",
    		state: "MS",
    		pop: 29690
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "MO",
    		pop: 0
    	},
    	{
    		county: "Adair County",
    		state: "MO",
    		pop: 25343
    	},
    	{
    		county: "Andrew County",
    		state: "MO",
    		pop: 17712
    	},
    	{
    		county: "Atchison County",
    		state: "MO",
    		pop: 5143
    	},
    	{
    		county: "Audrain County",
    		state: "MO",
    		pop: 25388
    	},
    	{
    		county: "Barry County",
    		state: "MO",
    		pop: 35789
    	},
    	{
    		county: "Barton County",
    		state: "MO",
    		pop: 11754
    	},
    	{
    		county: "Bates County",
    		state: "MO",
    		pop: 16172
    	},
    	{
    		county: "Benton County",
    		state: "MO",
    		pop: 19443
    	},
    	{
    		county: "Bollinger County",
    		state: "MO",
    		pop: 12133
    	},
    	{
    		county: "Boone County",
    		state: "MO",
    		pop: 180463
    	},
    	{
    		county: "Buchanan County",
    		state: "MO",
    		pop: 87364
    	},
    	{
    		county: "Butler County",
    		state: "MO",
    		pop: 42478
    	},
    	{
    		county: "Caldwell County",
    		state: "MO",
    		pop: 9020
    	},
    	{
    		county: "Callaway County",
    		state: "MO",
    		pop: 44743
    	},
    	{
    		county: "Camden County",
    		state: "MO",
    		pop: 46305
    	},
    	{
    		county: "Cape Girardeau County",
    		state: "MO",
    		pop: 78871
    	},
    	{
    		county: "Carroll County",
    		state: "MO",
    		pop: 8679
    	},
    	{
    		county: "Carter County",
    		state: "MO",
    		pop: 5982
    	},
    	{
    		county: "Cass County",
    		state: "MO",
    		pop: 105780
    	},
    	{
    		county: "Cedar County",
    		state: "MO",
    		pop: 14349
    	},
    	{
    		county: "Chariton County",
    		state: "MO",
    		pop: 7426
    	},
    	{
    		county: "Christian County",
    		state: "MO",
    		pop: 88595
    	},
    	{
    		county: "Clark County",
    		state: "MO",
    		pop: 6797
    	},
    	{
    		county: "Clay County",
    		state: "MO",
    		pop: 249948
    	},
    	{
    		county: "Clinton County",
    		state: "MO",
    		pop: 20387
    	},
    	{
    		county: "Cole County",
    		state: "MO",
    		pop: 76745
    	},
    	{
    		county: "Cooper County",
    		state: "MO",
    		pop: 17709
    	},
    	{
    		county: "Crawford County",
    		state: "MO",
    		pop: 23920
    	},
    	{
    		county: "Dade County",
    		state: "MO",
    		pop: 7561
    	},
    	{
    		county: "Dallas County",
    		state: "MO",
    		pop: 16878
    	},
    	{
    		county: "Daviess County",
    		state: "MO",
    		pop: 8278
    	},
    	{
    		county: "DeKalb County",
    		state: "MO",
    		pop: 12547
    	},
    	{
    		county: "Dent County",
    		state: "MO",
    		pop: 15573
    	},
    	{
    		county: "Douglas County",
    		state: "MO",
    		pop: 13185
    	},
    	{
    		county: "Dunklin County",
    		state: "MO",
    		pop: 29131
    	},
    	{
    		county: "Franklin County",
    		state: "MO",
    		pop: 103967
    	},
    	{
    		county: "Gasconade County",
    		state: "MO",
    		pop: 14706
    	},
    	{
    		county: "Gentry County",
    		state: "MO",
    		pop: 6571
    	},
    	{
    		county: "Greene County",
    		state: "MO",
    		pop: 293086
    	},
    	{
    		county: "Grundy County",
    		state: "MO",
    		pop: 9850
    	},
    	{
    		county: "Harrison County",
    		state: "MO",
    		pop: 8352
    	},
    	{
    		county: "Henry County",
    		state: "MO",
    		pop: 21824
    	},
    	{
    		county: "Hickory County",
    		state: "MO",
    		pop: 9544
    	},
    	{
    		county: "Holt County",
    		state: "MO",
    		pop: 4403
    	},
    	{
    		county: "Howard County",
    		state: "MO",
    		pop: 10001
    	},
    	{
    		county: "Howell County",
    		state: "MO",
    		pop: 40117
    	},
    	{
    		county: "Iron County",
    		state: "MO",
    		pop: 10125
    	},
    	{
    		county: "Jackson County (including other portions of Kansas City)",
    		state: "MO",
    		pop: 703011
    	},
    	{
    		county: "Jasper County",
    		state: "MO",
    		pop: 121328
    	},
    	{
    		county: "Jefferson County",
    		state: "MO",
    		pop: 225081
    	},
    	{
    		county: "Johnson County",
    		state: "MO",
    		pop: 54062
    	},
    	{
    		county: "Knox County",
    		state: "MO",
    		pop: 3959
    	},
    	{
    		county: "Laclede County",
    		state: "MO",
    		pop: 35723
    	},
    	{
    		county: "Lafayette County",
    		state: "MO",
    		pop: 32708
    	},
    	{
    		county: "Lawrence County",
    		state: "MO",
    		pop: 38355
    	},
    	{
    		county: "Lewis County",
    		state: "MO",
    		pop: 9776
    	},
    	{
    		county: "Lincoln County",
    		state: "MO",
    		pop: 59013
    	},
    	{
    		county: "Linn County",
    		state: "MO",
    		pop: 11920
    	},
    	{
    		county: "Livingston County",
    		state: "MO",
    		pop: 15227
    	},
    	{
    		county: "McDonald County",
    		state: "MO",
    		pop: 22837
    	},
    	{
    		county: "Macon County",
    		state: "MO",
    		pop: 15117
    	},
    	{
    		county: "Madison County",
    		state: "MO",
    		pop: 12088
    	},
    	{
    		county: "Maries County",
    		state: "MO",
    		pop: 8697
    	},
    	{
    		county: "Marion County",
    		state: "MO",
    		pop: 28530
    	},
    	{
    		county: "Mercer County",
    		state: "MO",
    		pop: 3617
    	},
    	{
    		county: "Miller County",
    		state: "MO",
    		pop: 25619
    	},
    	{
    		county: "Mississippi County",
    		state: "MO",
    		pop: 13180
    	},
    	{
    		county: "Moniteau County",
    		state: "MO",
    		pop: 16132
    	},
    	{
    		county: "Monroe County",
    		state: "MO",
    		pop: 8644
    	},
    	{
    		county: "Montgomery County",
    		state: "MO",
    		pop: 11551
    	},
    	{
    		county: "Morgan County",
    		state: "MO",
    		pop: 20627
    	},
    	{
    		county: "New Madrid County",
    		state: "MO",
    		pop: 17076
    	},
    	{
    		county: "Newton County",
    		state: "MO",
    		pop: 58236
    	},
    	{
    		county: "Nodaway County",
    		state: "MO",
    		pop: 22092
    	},
    	{
    		county: "Oregon County",
    		state: "MO",
    		pop: 10529
    	},
    	{
    		county: "Osage County",
    		state: "MO",
    		pop: 13615
    	},
    	{
    		county: "Ozark County",
    		state: "MO",
    		pop: 9174
    	},
    	{
    		county: "Pemiscot County",
    		state: "MO",
    		pop: 15805
    	},
    	{
    		county: "Perry County",
    		state: "MO",
    		pop: 19136
    	},
    	{
    		county: "Pettis County",
    		state: "MO",
    		pop: 42339
    	},
    	{
    		county: "Phelps County",
    		state: "MO",
    		pop: 44573
    	},
    	{
    		county: "Pike County",
    		state: "MO",
    		pop: 18302
    	},
    	{
    		county: "Platte County",
    		state: "MO",
    		pop: 104418
    	},
    	{
    		county: "Polk County",
    		state: "MO",
    		pop: 32149
    	},
    	{
    		county: "Pulaski County",
    		state: "MO",
    		pop: 52607
    	},
    	{
    		county: "Putnam County",
    		state: "MO",
    		pop: 4696
    	},
    	{
    		county: "Ralls County",
    		state: "MO",
    		pop: 10309
    	},
    	{
    		county: "Randolph County",
    		state: "MO",
    		pop: 24748
    	},
    	{
    		county: "Ray County",
    		state: "MO",
    		pop: 23018
    	},
    	{
    		county: "Reynolds County",
    		state: "MO",
    		pop: 6270
    	},
    	{
    		county: "Ripley County",
    		state: "MO",
    		pop: 13288
    	},
    	{
    		county: "St. Charles County",
    		state: "MO",
    		pop: 402022
    	},
    	{
    		county: "St. Clair County",
    		state: "MO",
    		pop: 9397
    	},
    	{
    		county: "Ste. Genevieve County",
    		state: "MO",
    		pop: 17894
    	},
    	{
    		county: "St. Francois County",
    		state: "MO",
    		pop: 67215
    	},
    	{
    		county: "St. Louis County",
    		state: "MO",
    		pop: 994205
    	},
    	{
    		county: "Saline County",
    		state: "MO",
    		pop: 22761
    	},
    	{
    		county: "Schuyler County",
    		state: "MO",
    		pop: 4660
    	},
    	{
    		county: "Scotland County",
    		state: "MO",
    		pop: 4902
    	},
    	{
    		county: "Scott County",
    		state: "MO",
    		pop: 38280
    	},
    	{
    		county: "Shannon County",
    		state: "MO",
    		pop: 8166
    	},
    	{
    		county: "Shelby County",
    		state: "MO",
    		pop: 5930
    	},
    	{
    		county: "Stoddard County",
    		state: "MO",
    		pop: 29025
    	},
    	{
    		county: "Stone County",
    		state: "MO",
    		pop: 31952
    	},
    	{
    		county: "Sullivan County",
    		state: "MO",
    		pop: 6089
    	},
    	{
    		county: "Taney County",
    		state: "MO",
    		pop: 55928
    	},
    	{
    		county: "Texas County",
    		state: "MO",
    		pop: 25398
    	},
    	{
    		county: "Vernon County",
    		state: "MO",
    		pop: 20563
    	},
    	{
    		county: "Warren County",
    		state: "MO",
    		pop: 35649
    	},
    	{
    		county: "Washington County",
    		state: "MO",
    		pop: 24730
    	},
    	{
    		county: "Wayne County",
    		state: "MO",
    		pop: 12873
    	},
    	{
    		county: "Webster County",
    		state: "MO",
    		pop: 39592
    	},
    	{
    		county: "Worth County",
    		state: "MO",
    		pop: 2013
    	},
    	{
    		county: "Wright County",
    		state: "MO",
    		pop: 18289
    	},
    	{
    		county: "City of St. Louis",
    		state: "MO",
    		pop: 300576
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "MT",
    		pop: 0
    	},
    	{
    		county: "Beaverhead County",
    		state: "MT",
    		pop: 9453
    	},
    	{
    		county: "Big Horn County",
    		state: "MT",
    		pop: 13319
    	},
    	{
    		county: "Blaine County",
    		state: "MT",
    		pop: 6681
    	},
    	{
    		county: "Broadwater County",
    		state: "MT",
    		pop: 6237
    	},
    	{
    		county: "Carbon County",
    		state: "MT",
    		pop: 10725
    	},
    	{
    		county: "Carter County",
    		state: "MT",
    		pop: 1252
    	},
    	{
    		county: "Cascade County",
    		state: "MT",
    		pop: 81366
    	},
    	{
    		county: "Chouteau County",
    		state: "MT",
    		pop: 5635
    	},
    	{
    		county: "Custer County",
    		state: "MT",
    		pop: 11402
    	},
    	{
    		county: "Daniels County",
    		state: "MT",
    		pop: 1690
    	},
    	{
    		county: "Dawson County",
    		state: "MT",
    		pop: 8613
    	},
    	{
    		county: "Deer Lodge County",
    		state: "MT",
    		pop: 9140
    	},
    	{
    		county: "Fallon County",
    		state: "MT",
    		pop: 2846
    	},
    	{
    		county: "Fergus County",
    		state: "MT",
    		pop: 11050
    	},
    	{
    		county: "Flathead County",
    		state: "MT",
    		pop: 103806
    	},
    	{
    		county: "Gallatin County",
    		state: "MT",
    		pop: 114434
    	},
    	{
    		county: "Garfield County",
    		state: "MT",
    		pop: 1258
    	},
    	{
    		county: "Glacier County",
    		state: "MT",
    		pop: 13753
    	},
    	{
    		county: "Golden Valley County",
    		state: "MT",
    		pop: 821
    	},
    	{
    		county: "Granite County",
    		state: "MT",
    		pop: 3379
    	},
    	{
    		county: "Hill County",
    		state: "MT",
    		pop: 16484
    	},
    	{
    		county: "Jefferson County",
    		state: "MT",
    		pop: 12221
    	},
    	{
    		county: "Judith Basin County",
    		state: "MT",
    		pop: 2007
    	},
    	{
    		county: "Lake County",
    		state: "MT",
    		pop: 30458
    	},
    	{
    		county: "Lewis and Clark County",
    		state: "MT",
    		pop: 69432
    	},
    	{
    		county: "Liberty County",
    		state: "MT",
    		pop: 2337
    	},
    	{
    		county: "Lincoln County",
    		state: "MT",
    		pop: 19980
    	},
    	{
    		county: "McCone County",
    		state: "MT",
    		pop: 1664
    	},
    	{
    		county: "Madison County",
    		state: "MT",
    		pop: 8600
    	},
    	{
    		county: "Meagher County",
    		state: "MT",
    		pop: 1862
    	},
    	{
    		county: "Mineral County",
    		state: "MT",
    		pop: 4397
    	},
    	{
    		county: "Missoula County",
    		state: "MT",
    		pop: 119600
    	},
    	{
    		county: "Musselshell County",
    		state: "MT",
    		pop: 4633
    	},
    	{
    		county: "Park County",
    		state: "MT",
    		pop: 16606
    	},
    	{
    		county: "Petroleum County",
    		state: "MT",
    		pop: 487
    	},
    	{
    		county: "Phillips County",
    		state: "MT",
    		pop: 3954
    	},
    	{
    		county: "Pondera County",
    		state: "MT",
    		pop: 5911
    	},
    	{
    		county: "Powder River County",
    		state: "MT",
    		pop: 1682
    	},
    	{
    		county: "Powell County",
    		state: "MT",
    		pop: 6890
    	},
    	{
    		county: "Prairie County",
    		state: "MT",
    		pop: 1077
    	},
    	{
    		county: "Ravalli County",
    		state: "MT",
    		pop: 43806
    	},
    	{
    		county: "Richland County",
    		state: "MT",
    		pop: 10803
    	},
    	{
    		county: "Roosevelt County",
    		state: "MT",
    		pop: 11004
    	},
    	{
    		county: "Rosebud County",
    		state: "MT",
    		pop: 8937
    	},
    	{
    		county: "Sanders County",
    		state: "MT",
    		pop: 12113
    	},
    	{
    		county: "Sheridan County",
    		state: "MT",
    		pop: 3309
    	},
    	{
    		county: "Silver Bow County",
    		state: "MT",
    		pop: 34915
    	},
    	{
    		county: "Stillwater County",
    		state: "MT",
    		pop: 9642
    	},
    	{
    		county: "Sweet Grass County",
    		state: "MT",
    		pop: 3737
    	},
    	{
    		county: "Teton County",
    		state: "MT",
    		pop: 6147
    	},
    	{
    		county: "Toole County",
    		state: "MT",
    		pop: 4736
    	},
    	{
    		county: "Treasure County",
    		state: "MT",
    		pop: 696
    	},
    	{
    		county: "Valley County",
    		state: "MT",
    		pop: 7396
    	},
    	{
    		county: "Wheatland County",
    		state: "MT",
    		pop: 2126
    	},
    	{
    		county: "Wibaux County",
    		state: "MT",
    		pop: 969
    	},
    	{
    		county: "Yellowstone County",
    		state: "MT",
    		pop: 161300
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "NE",
    		pop: 0
    	},
    	{
    		county: "Adams County",
    		state: "NE",
    		pop: 31363
    	},
    	{
    		county: "Antelope County",
    		state: "NE",
    		pop: 6298
    	},
    	{
    		county: "Arthur County",
    		state: "NE",
    		pop: 463
    	},
    	{
    		county: "Banner County",
    		state: "NE",
    		pop: 745
    	},
    	{
    		county: "Blaine County",
    		state: "NE",
    		pop: 465
    	},
    	{
    		county: "Boone County",
    		state: "NE",
    		pop: 5192
    	},
    	{
    		county: "Box Butte County",
    		state: "NE",
    		pop: 10783
    	},
    	{
    		county: "Boyd County",
    		state: "NE",
    		pop: 1919
    	},
    	{
    		county: "Brown County",
    		state: "NE",
    		pop: 2955
    	},
    	{
    		county: "Buffalo County",
    		state: "NE",
    		pop: 49659
    	},
    	{
    		county: "Burt County",
    		state: "NE",
    		pop: 6459
    	},
    	{
    		county: "Butler County",
    		state: "NE",
    		pop: 8016
    	},
    	{
    		county: "Cass County",
    		state: "NE",
    		pop: 26248
    	},
    	{
    		county: "Cedar County",
    		state: "NE",
    		pop: 8402
    	},
    	{
    		county: "Chase County",
    		state: "NE",
    		pop: 3924
    	},
    	{
    		county: "Cherry County",
    		state: "NE",
    		pop: 5689
    	},
    	{
    		county: "Cheyenne County",
    		state: "NE",
    		pop: 8910
    	},
    	{
    		county: "Clay County",
    		state: "NE",
    		pop: 6203
    	},
    	{
    		county: "Colfax County",
    		state: "NE",
    		pop: 10709
    	},
    	{
    		county: "Cuming County",
    		state: "NE",
    		pop: 8846
    	},
    	{
    		county: "Custer County",
    		state: "NE",
    		pop: 10777
    	},
    	{
    		county: "Dakota County",
    		state: "NE",
    		pop: 20026
    	},
    	{
    		county: "Dawes County",
    		state: "NE",
    		pop: 8589
    	},
    	{
    		county: "Dawson County",
    		state: "NE",
    		pop: 23595
    	},
    	{
    		county: "Deuel County",
    		state: "NE",
    		pop: 1794
    	},
    	{
    		county: "Dixon County",
    		state: "NE",
    		pop: 5636
    	},
    	{
    		county: "Dodge County",
    		state: "NE",
    		pop: 36565
    	},
    	{
    		county: "Douglas County",
    		state: "NE",
    		pop: 571327
    	},
    	{
    		county: "Dundy County",
    		state: "NE",
    		pop: 1693
    	},
    	{
    		county: "Fillmore County",
    		state: "NE",
    		pop: 5462
    	},
    	{
    		county: "Franklin County",
    		state: "NE",
    		pop: 2979
    	},
    	{
    		county: "Frontier County",
    		state: "NE",
    		pop: 2627
    	},
    	{
    		county: "Furnas County",
    		state: "NE",
    		pop: 4676
    	},
    	{
    		county: "Gage County",
    		state: "NE",
    		pop: 21513
    	},
    	{
    		county: "Garden County",
    		state: "NE",
    		pop: 1837
    	},
    	{
    		county: "Garfield County",
    		state: "NE",
    		pop: 1969
    	},
    	{
    		county: "Gosper County",
    		state: "NE",
    		pop: 1990
    	},
    	{
    		county: "Grant County",
    		state: "NE",
    		pop: 623
    	},
    	{
    		county: "Greeley County",
    		state: "NE",
    		pop: 2356
    	},
    	{
    		county: "Hall County",
    		state: "NE",
    		pop: 61353
    	},
    	{
    		county: "Hamilton County",
    		state: "NE",
    		pop: 9324
    	},
    	{
    		county: "Harlan County",
    		state: "NE",
    		pop: 3380
    	},
    	{
    		county: "Hayes County",
    		state: "NE",
    		pop: 922
    	},
    	{
    		county: "Hitchcock County",
    		state: "NE",
    		pop: 2762
    	},
    	{
    		county: "Holt County",
    		state: "NE",
    		pop: 10067
    	},
    	{
    		county: "Hooker County",
    		state: "NE",
    		pop: 682
    	},
    	{
    		county: "Howard County",
    		state: "NE",
    		pop: 6445
    	},
    	{
    		county: "Jefferson County",
    		state: "NE",
    		pop: 7046
    	},
    	{
    		county: "Johnson County",
    		state: "NE",
    		pop: 5071
    	},
    	{
    		county: "Kearney County",
    		state: "NE",
    		pop: 6495
    	},
    	{
    		county: "Keith County",
    		state: "NE",
    		pop: 8034
    	},
    	{
    		county: "Keya Paha County",
    		state: "NE",
    		pop: 806
    	},
    	{
    		county: "Kimball County",
    		state: "NE",
    		pop: 3632
    	},
    	{
    		county: "Knox County",
    		state: "NE",
    		pop: 8332
    	},
    	{
    		county: "Lancaster County",
    		state: "NE",
    		pop: 319090
    	},
    	{
    		county: "Lincoln County",
    		state: "NE",
    		pop: 34914
    	},
    	{
    		county: "Logan County",
    		state: "NE",
    		pop: 748
    	},
    	{
    		county: "Loup County",
    		state: "NE",
    		pop: 664
    	},
    	{
    		county: "McPherson County",
    		state: "NE",
    		pop: 494
    	},
    	{
    		county: "Madison County",
    		state: "NE",
    		pop: 35099
    	},
    	{
    		county: "Merrick County",
    		state: "NE",
    		pop: 7755
    	},
    	{
    		county: "Morrill County",
    		state: "NE",
    		pop: 4642
    	},
    	{
    		county: "Nance County",
    		state: "NE",
    		pop: 3519
    	},
    	{
    		county: "Nemaha County",
    		state: "NE",
    		pop: 6972
    	},
    	{
    		county: "Nuckolls County",
    		state: "NE",
    		pop: 4148
    	},
    	{
    		county: "Otoe County",
    		state: "NE",
    		pop: 16012
    	},
    	{
    		county: "Pawnee County",
    		state: "NE",
    		pop: 2613
    	},
    	{
    		county: "Perkins County",
    		state: "NE",
    		pop: 2891
    	},
    	{
    		county: "Phelps County",
    		state: "NE",
    		pop: 9034
    	},
    	{
    		county: "Pierce County",
    		state: "NE",
    		pop: 7148
    	},
    	{
    		county: "Platte County",
    		state: "NE",
    		pop: 33470
    	},
    	{
    		county: "Polk County",
    		state: "NE",
    		pop: 5213
    	},
    	{
    		county: "Red Willow County",
    		state: "NE",
    		pop: 10724
    	},
    	{
    		county: "Richardson County",
    		state: "NE",
    		pop: 7865
    	},
    	{
    		county: "Rock County",
    		state: "NE",
    		pop: 1357
    	},
    	{
    		county: "Saline County",
    		state: "NE",
    		pop: 14224
    	},
    	{
    		county: "Sarpy County",
    		state: "NE",
    		pop: 187196
    	},
    	{
    		county: "Saunders County",
    		state: "NE",
    		pop: 21578
    	},
    	{
    		county: "Scotts Bluff County",
    		state: "NE",
    		pop: 35618
    	},
    	{
    		county: "Seward County",
    		state: "NE",
    		pop: 17284
    	},
    	{
    		county: "Sheridan County",
    		state: "NE",
    		pop: 5246
    	},
    	{
    		county: "Sherman County",
    		state: "NE",
    		pop: 3001
    	},
    	{
    		county: "Sioux County",
    		state: "NE",
    		pop: 1166
    	},
    	{
    		county: "Stanton County",
    		state: "NE",
    		pop: 5920
    	},
    	{
    		county: "Thayer County",
    		state: "NE",
    		pop: 5003
    	},
    	{
    		county: "Thomas County",
    		state: "NE",
    		pop: 722
    	},
    	{
    		county: "Thurston County",
    		state: "NE",
    		pop: 7224
    	},
    	{
    		county: "Valley County",
    		state: "NE",
    		pop: 4158
    	},
    	{
    		county: "Washington County",
    		state: "NE",
    		pop: 20729
    	},
    	{
    		county: "Wayne County",
    		state: "NE",
    		pop: 9385
    	},
    	{
    		county: "Webster County",
    		state: "NE",
    		pop: 3487
    	},
    	{
    		county: "Wheeler County",
    		state: "NE",
    		pop: 783
    	},
    	{
    		county: "York County",
    		state: "NE",
    		pop: 13679
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "NV",
    		pop: 0
    	},
    	{
    		county: "Churchill County",
    		state: "NV",
    		pop: 24909
    	},
    	{
    		county: "Clark County",
    		state: "NV",
    		pop: 2266715
    	},
    	{
    		county: "Douglas County",
    		state: "NV",
    		pop: 48905
    	},
    	{
    		county: "Elko County",
    		state: "NV",
    		pop: 52778
    	},
    	{
    		county: "Esmeralda County",
    		state: "NV",
    		pop: 873
    	},
    	{
    		county: "Eureka County",
    		state: "NV",
    		pop: 2029
    	},
    	{
    		county: "Humboldt County",
    		state: "NV",
    		pop: 16831
    	},
    	{
    		county: "Lander County",
    		state: "NV",
    		pop: 5532
    	},
    	{
    		county: "Lincoln County",
    		state: "NV",
    		pop: 5183
    	},
    	{
    		county: "Lyon County",
    		state: "NV",
    		pop: 57510
    	},
    	{
    		county: "Mineral County",
    		state: "NV",
    		pop: 4505
    	},
    	{
    		county: "Nye County",
    		state: "NV",
    		pop: 46523
    	},
    	{
    		county: "Pershing County",
    		state: "NV",
    		pop: 6725
    	},
    	{
    		county: "Storey County",
    		state: "NV",
    		pop: 4123
    	},
    	{
    		county: "Washoe County",
    		state: "NV",
    		pop: 471519
    	},
    	{
    		county: "White Pine County",
    		state: "NV",
    		pop: 9580
    	},
    	{
    		county: "Carson City",
    		state: "NV",
    		pop: 55916
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "NH",
    		pop: 0
    	},
    	{
    		county: "Belknap County",
    		state: "NH",
    		pop: 61303
    	},
    	{
    		county: "Carroll County",
    		state: "NH",
    		pop: 48910
    	},
    	{
    		county: "Cheshire County",
    		state: "NH",
    		pop: 76085
    	},
    	{
    		county: "Coos County",
    		state: "NH",
    		pop: 31563
    	},
    	{
    		county: "Grafton County",
    		state: "NH",
    		pop: 89886
    	},
    	{
    		county: "Hillsborough County",
    		state: "NH",
    		pop: 417025
    	},
    	{
    		county: "Merrimack County",
    		state: "NH",
    		pop: 151391
    	},
    	{
    		county: "Rockingham County",
    		state: "NH",
    		pop: 309769
    	},
    	{
    		county: "Strafford County",
    		state: "NH",
    		pop: 130633
    	},
    	{
    		county: "Sullivan County",
    		state: "NH",
    		pop: 43146
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "NJ",
    		pop: 0
    	},
    	{
    		county: "Atlantic County",
    		state: "NJ",
    		pop: 263670
    	},
    	{
    		county: "Bergen County",
    		state: "NJ",
    		pop: 932202
    	},
    	{
    		county: "Burlington County",
    		state: "NJ",
    		pop: 445349
    	},
    	{
    		county: "Camden County",
    		state: "NJ",
    		pop: 506471
    	},
    	{
    		county: "Cape May County",
    		state: "NJ",
    		pop: 92039
    	},
    	{
    		county: "Cumberland County",
    		state: "NJ",
    		pop: 149527
    	},
    	{
    		county: "Essex County",
    		state: "NJ",
    		pop: 798975
    	},
    	{
    		county: "Gloucester County",
    		state: "NJ",
    		pop: 291636
    	},
    	{
    		county: "Hudson County",
    		state: "NJ",
    		pop: 672391
    	},
    	{
    		county: "Hunterdon County",
    		state: "NJ",
    		pop: 124371
    	},
    	{
    		county: "Mercer County",
    		state: "NJ",
    		pop: 367430
    	},
    	{
    		county: "Middlesex County",
    		state: "NJ",
    		pop: 825062
    	},
    	{
    		county: "Monmouth County",
    		state: "NJ",
    		pop: 618795
    	},
    	{
    		county: "Morris County",
    		state: "NJ",
    		pop: 491845
    	},
    	{
    		county: "Ocean County",
    		state: "NJ",
    		pop: 607186
    	},
    	{
    		county: "Passaic County",
    		state: "NJ",
    		pop: 501826
    	},
    	{
    		county: "Salem County",
    		state: "NJ",
    		pop: 62385
    	},
    	{
    		county: "Somerset County",
    		state: "NJ",
    		pop: 328934
    	},
    	{
    		county: "Sussex County",
    		state: "NJ",
    		pop: 140488
    	},
    	{
    		county: "Union County",
    		state: "NJ",
    		pop: 556341
    	},
    	{
    		county: "Warren County",
    		state: "NJ",
    		pop: 105267
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "NM",
    		pop: 0
    	},
    	{
    		county: "Bernalillo County",
    		state: "NM",
    		pop: 679121
    	},
    	{
    		county: "Catron County",
    		state: "NM",
    		pop: 3527
    	},
    	{
    		county: "Chaves County",
    		state: "NM",
    		pop: 64615
    	},
    	{
    		county: "Cibola County",
    		state: "NM",
    		pop: 26675
    	},
    	{
    		county: "Colfax County",
    		state: "NM",
    		pop: 11941
    	},
    	{
    		county: "Curry County",
    		state: "NM",
    		pop: 48954
    	},
    	{
    		county: "De Baca County",
    		state: "NM",
    		pop: 1748
    	},
    	{
    		county: "Doña Ana County",
    		state: "NM",
    		pop: 218195
    	},
    	{
    		county: "Eddy County",
    		state: "NM",
    		pop: 58460
    	},
    	{
    		county: "Grant County",
    		state: "NM",
    		pop: 26998
    	},
    	{
    		county: "Guadalupe County",
    		state: "NM",
    		pop: 4300
    	},
    	{
    		county: "Harding County",
    		state: "NM",
    		pop: 625
    	},
    	{
    		county: "Hidalgo County",
    		state: "NM",
    		pop: 4198
    	},
    	{
    		county: "Lea County",
    		state: "NM",
    		pop: 71070
    	},
    	{
    		county: "Lincoln County",
    		state: "NM",
    		pop: 19572
    	},
    	{
    		county: "Los Alamos County",
    		state: "NM",
    		pop: 19369
    	},
    	{
    		county: "Luna County",
    		state: "NM",
    		pop: 23709
    	},
    	{
    		county: "McKinley County",
    		state: "NM",
    		pop: 71367
    	},
    	{
    		county: "Mora County",
    		state: "NM",
    		pop: 4521
    	},
    	{
    		county: "Otero County",
    		state: "NM",
    		pop: 67490
    	},
    	{
    		county: "Quay County",
    		state: "NM",
    		pop: 8253
    	},
    	{
    		county: "Rio Arriba County",
    		state: "NM",
    		pop: 38921
    	},
    	{
    		county: "Roosevelt County",
    		state: "NM",
    		pop: 18500
    	},
    	{
    		county: "Sandoval County",
    		state: "NM",
    		pop: 146748
    	},
    	{
    		county: "San Juan County",
    		state: "NM",
    		pop: 123958
    	},
    	{
    		county: "San Miguel County",
    		state: "NM",
    		pop: 27277
    	},
    	{
    		county: "Santa Fe County",
    		state: "NM",
    		pop: 150358
    	},
    	{
    		county: "Sierra County",
    		state: "NM",
    		pop: 10791
    	},
    	{
    		county: "Socorro County",
    		state: "NM",
    		pop: 16637
    	},
    	{
    		county: "Taos County",
    		state: "NM",
    		pop: 32723
    	},
    	{
    		county: "Torrance County",
    		state: "NM",
    		pop: 15461
    	},
    	{
    		county: "Union County",
    		state: "NM",
    		pop: 4059
    	},
    	{
    		county: "Valencia County",
    		state: "NM",
    		pop: 76688
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "NY",
    		pop: 0
    	},
    	{
    		county: "New York City Unallocated",
    		state: "NY",
    		pop: 0
    	},
    	{
    		county: "Albany County",
    		state: "NY",
    		pop: 305506
    	},
    	{
    		county: "Allegany County",
    		state: "NY",
    		pop: 46091
    	},
    	{
    		county: "Bronx County",
    		state: "NY",
    		pop: 1418207
    	},
    	{
    		county: "Broome County",
    		state: "NY",
    		pop: 190488
    	},
    	{
    		county: "Cattaraugus County",
    		state: "NY",
    		pop: 76117
    	},
    	{
    		county: "Cayuga County",
    		state: "NY",
    		pop: 76576
    	},
    	{
    		county: "Chautauqua County",
    		state: "NY",
    		pop: 126903
    	},
    	{
    		county: "Chemung County",
    		state: "NY",
    		pop: 83456
    	},
    	{
    		county: "Chenango County",
    		state: "NY",
    		pop: 47207
    	},
    	{
    		county: "Clinton County",
    		state: "NY",
    		pop: 80485
    	},
    	{
    		county: "Columbia County",
    		state: "NY",
    		pop: 59461
    	},
    	{
    		county: "Cortland County",
    		state: "NY",
    		pop: 47581
    	},
    	{
    		county: "Delaware County",
    		state: "NY",
    		pop: 44135
    	},
    	{
    		county: "Dutchess County",
    		state: "NY",
    		pop: 294218
    	},
    	{
    		county: "Erie County",
    		state: "NY",
    		pop: 918702
    	},
    	{
    		county: "Essex County",
    		state: "NY",
    		pop: 36885
    	},
    	{
    		county: "Franklin County",
    		state: "NY",
    		pop: 50022
    	},
    	{
    		county: "Fulton County",
    		state: "NY",
    		pop: 53383
    	},
    	{
    		county: "Genesee County",
    		state: "NY",
    		pop: 57280
    	},
    	{
    		county: "Greene County",
    		state: "NY",
    		pop: 47188
    	},
    	{
    		county: "Hamilton County",
    		state: "NY",
    		pop: 4416
    	},
    	{
    		county: "Herkimer County",
    		state: "NY",
    		pop: 61319
    	},
    	{
    		county: "Jefferson County",
    		state: "NY",
    		pop: 109834
    	},
    	{
    		county: "Kings County",
    		state: "NY",
    		pop: 2559903
    	},
    	{
    		county: "Lewis County",
    		state: "NY",
    		pop: 26296
    	},
    	{
    		county: "Livingston County",
    		state: "NY",
    		pop: 62914
    	},
    	{
    		county: "Madison County",
    		state: "NY",
    		pop: 70941
    	},
    	{
    		county: "Monroe County",
    		state: "NY",
    		pop: 741770
    	},
    	{
    		county: "Montgomery County",
    		state: "NY",
    		pop: 49221
    	},
    	{
    		county: "Nassau County",
    		state: "NY",
    		pop: 1356924
    	},
    	{
    		county: "New York County",
    		state: "NY",
    		pop: 1628706
    	},
    	{
    		county: "Niagara County",
    		state: "NY",
    		pop: 209281
    	},
    	{
    		county: "Oneida County",
    		state: "NY",
    		pop: 228671
    	},
    	{
    		county: "Onondaga County",
    		state: "NY",
    		pop: 460528
    	},
    	{
    		county: "Ontario County",
    		state: "NY",
    		pop: 109777
    	},
    	{
    		county: "Orange County",
    		state: "NY",
    		pop: 384940
    	},
    	{
    		county: "Orleans County",
    		state: "NY",
    		pop: 40352
    	},
    	{
    		county: "Oswego County",
    		state: "NY",
    		pop: 117124
    	},
    	{
    		county: "Otsego County",
    		state: "NY",
    		pop: 59493
    	},
    	{
    		county: "Putnam County",
    		state: "NY",
    		pop: 98320
    	},
    	{
    		county: "Queens County",
    		state: "NY",
    		pop: 2253858
    	},
    	{
    		county: "Rensselaer County",
    		state: "NY",
    		pop: 158714
    	},
    	{
    		county: "Richmond County",
    		state: "NY",
    		pop: 476143
    	},
    	{
    		county: "Rockland County",
    		state: "NY",
    		pop: 325789
    	},
    	{
    		county: "St. Lawrence County",
    		state: "NY",
    		pop: 107740
    	},
    	{
    		county: "Saratoga County",
    		state: "NY",
    		pop: 229863
    	},
    	{
    		county: "Schenectady County",
    		state: "NY",
    		pop: 155299
    	},
    	{
    		county: "Schoharie County",
    		state: "NY",
    		pop: 30999
    	},
    	{
    		county: "Schuyler County",
    		state: "NY",
    		pop: 17807
    	},
    	{
    		county: "Seneca County",
    		state: "NY",
    		pop: 34016
    	},
    	{
    		county: "Steuben County",
    		state: "NY",
    		pop: 95379
    	},
    	{
    		county: "Suffolk County",
    		state: "NY",
    		pop: 1476601
    	},
    	{
    		county: "Sullivan County",
    		state: "NY",
    		pop: 75432
    	},
    	{
    		county: "Tioga County",
    		state: "NY",
    		pop: 48203
    	},
    	{
    		county: "Tompkins County",
    		state: "NY",
    		pop: 102180
    	},
    	{
    		county: "Ulster County",
    		state: "NY",
    		pop: 177573
    	},
    	{
    		county: "Warren County",
    		state: "NY",
    		pop: 63944
    	},
    	{
    		county: "Washington County",
    		state: "NY",
    		pop: 61204
    	},
    	{
    		county: "Wayne County",
    		state: "NY",
    		pop: 89918
    	},
    	{
    		county: "Westchester County",
    		state: "NY",
    		pop: 967506
    	},
    	{
    		county: "Wyoming County",
    		state: "NY",
    		pop: 39859
    	},
    	{
    		county: "Yates County",
    		state: "NY",
    		pop: 24913
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "NC",
    		pop: 0
    	},
    	{
    		county: "Alamance County",
    		state: "NC",
    		pop: 169509
    	},
    	{
    		county: "Alexander County",
    		state: "NC",
    		pop: 37497
    	},
    	{
    		county: "Alleghany County",
    		state: "NC",
    		pop: 11137
    	},
    	{
    		county: "Anson County",
    		state: "NC",
    		pop: 24446
    	},
    	{
    		county: "Ashe County",
    		state: "NC",
    		pop: 27203
    	},
    	{
    		county: "Avery County",
    		state: "NC",
    		pop: 17557
    	},
    	{
    		county: "Beaufort County",
    		state: "NC",
    		pop: 46994
    	},
    	{
    		county: "Bertie County",
    		state: "NC",
    		pop: 18947
    	},
    	{
    		county: "Bladen County",
    		state: "NC",
    		pop: 32722
    	},
    	{
    		county: "Brunswick County",
    		state: "NC",
    		pop: 142820
    	},
    	{
    		county: "Buncombe County",
    		state: "NC",
    		pop: 261191
    	},
    	{
    		county: "Burke County",
    		state: "NC",
    		pop: 90485
    	},
    	{
    		county: "Cabarrus County",
    		state: "NC",
    		pop: 216453
    	},
    	{
    		county: "Caldwell County",
    		state: "NC",
    		pop: 82178
    	},
    	{
    		county: "Camden County",
    		state: "NC",
    		pop: 10867
    	},
    	{
    		county: "Carteret County",
    		state: "NC",
    		pop: 69473
    	},
    	{
    		county: "Caswell County",
    		state: "NC",
    		pop: 22604
    	},
    	{
    		county: "Catawba County",
    		state: "NC",
    		pop: 159551
    	},
    	{
    		county: "Chatham County",
    		state: "NC",
    		pop: 74470
    	},
    	{
    		county: "Cherokee County",
    		state: "NC",
    		pop: 28612
    	},
    	{
    		county: "Chowan County",
    		state: "NC",
    		pop: 13943
    	},
    	{
    		county: "Clay County",
    		state: "NC",
    		pop: 11231
    	},
    	{
    		county: "Cleveland County",
    		state: "NC",
    		pop: 97947
    	},
    	{
    		county: "Columbus County",
    		state: "NC",
    		pop: 55508
    	},
    	{
    		county: "Craven County",
    		state: "NC",
    		pop: 102139
    	},
    	{
    		county: "Cumberland County",
    		state: "NC",
    		pop: 335509
    	},
    	{
    		county: "Currituck County",
    		state: "NC",
    		pop: 27763
    	},
    	{
    		county: "Dare County",
    		state: "NC",
    		pop: 37009
    	},
    	{
    		county: "Davidson County",
    		state: "NC",
    		pop: 167609
    	},
    	{
    		county: "Davie County",
    		state: "NC",
    		pop: 42846
    	},
    	{
    		county: "Duplin County",
    		state: "NC",
    		pop: 58741
    	},
    	{
    		county: "Durham County",
    		state: "NC",
    		pop: 321488
    	},
    	{
    		county: "Edgecombe County",
    		state: "NC",
    		pop: 51472
    	},
    	{
    		county: "Forsyth County",
    		state: "NC",
    		pop: 382295
    	},
    	{
    		county: "Franklin County",
    		state: "NC",
    		pop: 69685
    	},
    	{
    		county: "Gaston County",
    		state: "NC",
    		pop: 224529
    	},
    	{
    		county: "Gates County",
    		state: "NC",
    		pop: 11562
    	},
    	{
    		county: "Graham County",
    		state: "NC",
    		pop: 8441
    	},
    	{
    		county: "Granville County",
    		state: "NC",
    		pop: 60443
    	},
    	{
    		county: "Greene County",
    		state: "NC",
    		pop: 21069
    	},
    	{
    		county: "Guilford County",
    		state: "NC",
    		pop: 537174
    	},
    	{
    		county: "Halifax County",
    		state: "NC",
    		pop: 50010
    	},
    	{
    		county: "Harnett County",
    		state: "NC",
    		pop: 135976
    	},
    	{
    		county: "Haywood County",
    		state: "NC",
    		pop: 62317
    	},
    	{
    		county: "Henderson County",
    		state: "NC",
    		pop: 117417
    	},
    	{
    		county: "Hertford County",
    		state: "NC",
    		pop: 23677
    	},
    	{
    		county: "Hoke County",
    		state: "NC",
    		pop: 55234
    	},
    	{
    		county: "Hyde County",
    		state: "NC",
    		pop: 4937
    	},
    	{
    		county: "Iredell County",
    		state: "NC",
    		pop: 181806
    	},
    	{
    		county: "Jackson County",
    		state: "NC",
    		pop: 43938
    	},
    	{
    		county: "Johnston County",
    		state: "NC",
    		pop: 209339
    	},
    	{
    		county: "Jones County",
    		state: "NC",
    		pop: 9419
    	},
    	{
    		county: "Lee County",
    		state: "NC",
    		pop: 61779
    	},
    	{
    		county: "Lenoir County",
    		state: "NC",
    		pop: 55949
    	},
    	{
    		county: "Lincoln County",
    		state: "NC",
    		pop: 86111
    	},
    	{
    		county: "McDowell County",
    		state: "NC",
    		pop: 45756
    	},
    	{
    		county: "Macon County",
    		state: "NC",
    		pop: 35858
    	},
    	{
    		county: "Madison County",
    		state: "NC",
    		pop: 21755
    	},
    	{
    		county: "Martin County",
    		state: "NC",
    		pop: 22440
    	},
    	{
    		county: "Mecklenburg County",
    		state: "NC",
    		pop: 1110356
    	},
    	{
    		county: "Mitchell County",
    		state: "NC",
    		pop: 14964
    	},
    	{
    		county: "Montgomery County",
    		state: "NC",
    		pop: 27173
    	},
    	{
    		county: "Moore County",
    		state: "NC",
    		pop: 100880
    	},
    	{
    		county: "Nash County",
    		state: "NC",
    		pop: 94298
    	},
    	{
    		county: "New Hanover County",
    		state: "NC",
    		pop: 234473
    	},
    	{
    		county: "Northampton County",
    		state: "NC",
    		pop: 19483
    	},
    	{
    		county: "Onslow County",
    		state: "NC",
    		pop: 197938
    	},
    	{
    		county: "Orange County",
    		state: "NC",
    		pop: 148476
    	},
    	{
    		county: "Pamlico County",
    		state: "NC",
    		pop: 12726
    	},
    	{
    		county: "Pasquotank County",
    		state: "NC",
    		pop: 39824
    	},
    	{
    		county: "Pender County",
    		state: "NC",
    		pop: 63060
    	},
    	{
    		county: "Perquimans County",
    		state: "NC",
    		pop: 13463
    	},
    	{
    		county: "Person County",
    		state: "NC",
    		pop: 39490
    	},
    	{
    		county: "Pitt County",
    		state: "NC",
    		pop: 180742
    	},
    	{
    		county: "Polk County",
    		state: "NC",
    		pop: 20724
    	},
    	{
    		county: "Randolph County",
    		state: "NC",
    		pop: 143667
    	},
    	{
    		county: "Richmond County",
    		state: "NC",
    		pop: 44829
    	},
    	{
    		county: "Robeson County",
    		state: "NC",
    		pop: 130625
    	},
    	{
    		county: "Rockingham County",
    		state: "NC",
    		pop: 91010
    	},
    	{
    		county: "Rowan County",
    		state: "NC",
    		pop: 142088
    	},
    	{
    		county: "Rutherford County",
    		state: "NC",
    		pop: 67029
    	},
    	{
    		county: "Sampson County",
    		state: "NC",
    		pop: 63531
    	},
    	{
    		county: "Scotland County",
    		state: "NC",
    		pop: 34823
    	},
    	{
    		county: "Stanly County",
    		state: "NC",
    		pop: 62806
    	},
    	{
    		county: "Stokes County",
    		state: "NC",
    		pop: 45591
    	},
    	{
    		county: "Surry County",
    		state: "NC",
    		pop: 71783
    	},
    	{
    		county: "Swain County",
    		state: "NC",
    		pop: 14271
    	},
    	{
    		county: "Transylvania County",
    		state: "NC",
    		pop: 34385
    	},
    	{
    		county: "Tyrrell County",
    		state: "NC",
    		pop: 4016
    	},
    	{
    		county: "Union County",
    		state: "NC",
    		pop: 239859
    	},
    	{
    		county: "Vance County",
    		state: "NC",
    		pop: 44535
    	},
    	{
    		county: "Wake County",
    		state: "NC",
    		pop: 1111761
    	},
    	{
    		county: "Warren County",
    		state: "NC",
    		pop: 19731
    	},
    	{
    		county: "Washington County",
    		state: "NC",
    		pop: 11580
    	},
    	{
    		county: "Watauga County",
    		state: "NC",
    		pop: 56177
    	},
    	{
    		county: "Wayne County",
    		state: "NC",
    		pop: 123131
    	},
    	{
    		county: "Wilkes County",
    		state: "NC",
    		pop: 68412
    	},
    	{
    		county: "Wilson County",
    		state: "NC",
    		pop: 81801
    	},
    	{
    		county: "Yadkin County",
    		state: "NC",
    		pop: 37667
    	},
    	{
    		county: "Yancey County",
    		state: "NC",
    		pop: 18069
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "ND",
    		pop: 0
    	},
    	{
    		county: "Adams County",
    		state: "ND",
    		pop: 2216
    	},
    	{
    		county: "Barnes County",
    		state: "ND",
    		pop: 10415
    	},
    	{
    		county: "Benson County",
    		state: "ND",
    		pop: 6832
    	},
    	{
    		county: "Billings County",
    		state: "ND",
    		pop: 928
    	},
    	{
    		county: "Bottineau County",
    		state: "ND",
    		pop: 6282
    	},
    	{
    		county: "Bowman County",
    		state: "ND",
    		pop: 3024
    	},
    	{
    		county: "Burke County",
    		state: "ND",
    		pop: 2115
    	},
    	{
    		county: "Burleigh County",
    		state: "ND",
    		pop: 95626
    	},
    	{
    		county: "Cass County",
    		state: "ND",
    		pop: 181923
    	},
    	{
    		county: "Cavalier County",
    		state: "ND",
    		pop: 3762
    	},
    	{
    		county: "Dickey County",
    		state: "ND",
    		pop: 4872
    	},
    	{
    		county: "Divide County",
    		state: "ND",
    		pop: 2264
    	},
    	{
    		county: "Dunn County",
    		state: "ND",
    		pop: 4424
    	},
    	{
    		county: "Eddy County",
    		state: "ND",
    		pop: 2287
    	},
    	{
    		county: "Emmons County",
    		state: "ND",
    		pop: 3241
    	},
    	{
    		county: "Foster County",
    		state: "ND",
    		pop: 3210
    	},
    	{
    		county: "Golden Valley County",
    		state: "ND",
    		pop: 1761
    	},
    	{
    		county: "Grand Forks County",
    		state: "ND",
    		pop: 69451
    	},
    	{
    		county: "Grant County",
    		state: "ND",
    		pop: 2274
    	},
    	{
    		county: "Griggs County",
    		state: "ND",
    		pop: 2231
    	},
    	{
    		county: "Hettinger County",
    		state: "ND",
    		pop: 2499
    	},
    	{
    		county: "Kidder County",
    		state: "ND",
    		pop: 2480
    	},
    	{
    		county: "LaMoure County",
    		state: "ND",
    		pop: 4046
    	},
    	{
    		county: "Logan County",
    		state: "ND",
    		pop: 1850
    	},
    	{
    		county: "McHenry County",
    		state: "ND",
    		pop: 5745
    	},
    	{
    		county: "McIntosh County",
    		state: "ND",
    		pop: 2497
    	},
    	{
    		county: "McKenzie County",
    		state: "ND",
    		pop: 15024
    	},
    	{
    		county: "McLean County",
    		state: "ND",
    		pop: 9450
    	},
    	{
    		county: "Mercer County",
    		state: "ND",
    		pop: 8187
    	},
    	{
    		county: "Morton County",
    		state: "ND",
    		pop: 31364
    	},
    	{
    		county: "Mountrail County",
    		state: "ND",
    		pop: 10545
    	},
    	{
    		county: "Nelson County",
    		state: "ND",
    		pop: 2879
    	},
    	{
    		county: "Oliver County",
    		state: "ND",
    		pop: 1959
    	},
    	{
    		county: "Pembina County",
    		state: "ND",
    		pop: 6801
    	},
    	{
    		county: "Pierce County",
    		state: "ND",
    		pop: 3975
    	},
    	{
    		county: "Ramsey County",
    		state: "ND",
    		pop: 11519
    	},
    	{
    		county: "Ransom County",
    		state: "ND",
    		pop: 5218
    	},
    	{
    		county: "Renville County",
    		state: "ND",
    		pop: 2327
    	},
    	{
    		county: "Richland County",
    		state: "ND",
    		pop: 16177
    	},
    	{
    		county: "Rolette County",
    		state: "ND",
    		pop: 14176
    	},
    	{
    		county: "Sargent County",
    		state: "ND",
    		pop: 3898
    	},
    	{
    		county: "Sheridan County",
    		state: "ND",
    		pop: 1315
    	},
    	{
    		county: "Sioux County",
    		state: "ND",
    		pop: 4230
    	},
    	{
    		county: "Slope County",
    		state: "ND",
    		pop: 750
    	},
    	{
    		county: "Stark County",
    		state: "ND",
    		pop: 31489
    	},
    	{
    		county: "Steele County",
    		state: "ND",
    		pop: 1890
    	},
    	{
    		county: "Stutsman County",
    		state: "ND",
    		pop: 20704
    	},
    	{
    		county: "Towner County",
    		state: "ND",
    		pop: 2189
    	},
    	{
    		county: "Traill County",
    		state: "ND",
    		pop: 8036
    	},
    	{
    		county: "Walsh County",
    		state: "ND",
    		pop: 10641
    	},
    	{
    		county: "Ward County",
    		state: "ND",
    		pop: 67641
    	},
    	{
    		county: "Wells County",
    		state: "ND",
    		pop: 3834
    	},
    	{
    		county: "Williams County",
    		state: "ND",
    		pop: 37589
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "OH",
    		pop: 0
    	},
    	{
    		county: "Adams County",
    		state: "OH",
    		pop: 27698
    	},
    	{
    		county: "Allen County",
    		state: "OH",
    		pop: 102351
    	},
    	{
    		county: "Ashland County",
    		state: "OH",
    		pop: 53484
    	},
    	{
    		county: "Ashtabula County",
    		state: "OH",
    		pop: 97241
    	},
    	{
    		county: "Athens County",
    		state: "OH",
    		pop: 65327
    	},
    	{
    		county: "Auglaize County",
    		state: "OH",
    		pop: 45656
    	},
    	{
    		county: "Belmont County",
    		state: "OH",
    		pop: 67006
    	},
    	{
    		county: "Brown County",
    		state: "OH",
    		pop: 43432
    	},
    	{
    		county: "Butler County",
    		state: "OH",
    		pop: 383134
    	},
    	{
    		county: "Carroll County",
    		state: "OH",
    		pop: 26914
    	},
    	{
    		county: "Champaign County",
    		state: "OH",
    		pop: 38885
    	},
    	{
    		county: "Clark County",
    		state: "OH",
    		pop: 134083
    	},
    	{
    		county: "Clermont County",
    		state: "OH",
    		pop: 206428
    	},
    	{
    		county: "Clinton County",
    		state: "OH",
    		pop: 41968
    	},
    	{
    		county: "Columbiana County",
    		state: "OH",
    		pop: 101883
    	},
    	{
    		county: "Coshocton County",
    		state: "OH",
    		pop: 36600
    	},
    	{
    		county: "Crawford County",
    		state: "OH",
    		pop: 41494
    	},
    	{
    		county: "Cuyahoga County",
    		state: "OH",
    		pop: 1235072
    	},
    	{
    		county: "Darke County",
    		state: "OH",
    		pop: 51113
    	},
    	{
    		county: "Defiance County",
    		state: "OH",
    		pop: 38087
    	},
    	{
    		county: "Delaware County",
    		state: "OH",
    		pop: 209177
    	},
    	{
    		county: "Erie County",
    		state: "OH",
    		pop: 74266
    	},
    	{
    		county: "Fairfield County",
    		state: "OH",
    		pop: 157574
    	},
    	{
    		county: "Fayette County",
    		state: "OH",
    		pop: 28525
    	},
    	{
    		county: "Franklin County",
    		state: "OH",
    		pop: 1316756
    	},
    	{
    		county: "Fulton County",
    		state: "OH",
    		pop: 42126
    	},
    	{
    		county: "Gallia County",
    		state: "OH",
    		pop: 29898
    	},
    	{
    		county: "Geauga County",
    		state: "OH",
    		pop: 93649
    	},
    	{
    		county: "Greene County",
    		state: "OH",
    		pop: 168937
    	},
    	{
    		county: "Guernsey County",
    		state: "OH",
    		pop: 38875
    	},
    	{
    		county: "Hamilton County",
    		state: "OH",
    		pop: 817473
    	},
    	{
    		county: "Hancock County",
    		state: "OH",
    		pop: 75783
    	},
    	{
    		county: "Hardin County",
    		state: "OH",
    		pop: 31365
    	},
    	{
    		county: "Harrison County",
    		state: "OH",
    		pop: 15040
    	},
    	{
    		county: "Henry County",
    		state: "OH",
    		pop: 27006
    	},
    	{
    		county: "Highland County",
    		state: "OH",
    		pop: 43161
    	},
    	{
    		county: "Hocking County",
    		state: "OH",
    		pop: 28264
    	},
    	{
    		county: "Holmes County",
    		state: "OH",
    		pop: 43960
    	},
    	{
    		county: "Huron County",
    		state: "OH",
    		pop: 58266
    	},
    	{
    		county: "Jackson County",
    		state: "OH",
    		pop: 32413
    	},
    	{
    		county: "Jefferson County",
    		state: "OH",
    		pop: 65325
    	},
    	{
    		county: "Knox County",
    		state: "OH",
    		pop: 62322
    	},
    	{
    		county: "Lake County",
    		state: "OH",
    		pop: 230149
    	},
    	{
    		county: "Lawrence County",
    		state: "OH",
    		pop: 59463
    	},
    	{
    		county: "Licking County",
    		state: "OH",
    		pop: 176862
    	},
    	{
    		county: "Logan County",
    		state: "OH",
    		pop: 45672
    	},
    	{
    		county: "Lorain County",
    		state: "OH",
    		pop: 309833
    	},
    	{
    		county: "Lucas County",
    		state: "OH",
    		pop: 428348
    	},
    	{
    		county: "Madison County",
    		state: "OH",
    		pop: 44731
    	},
    	{
    		county: "Mahoning County",
    		state: "OH",
    		pop: 228683
    	},
    	{
    		county: "Marion County",
    		state: "OH",
    		pop: 65093
    	},
    	{
    		county: "Medina County",
    		state: "OH",
    		pop: 179746
    	},
    	{
    		county: "Meigs County",
    		state: "OH",
    		pop: 22907
    	},
    	{
    		county: "Mercer County",
    		state: "OH",
    		pop: 41172
    	},
    	{
    		county: "Miami County",
    		state: "OH",
    		pop: 106987
    	},
    	{
    		county: "Monroe County",
    		state: "OH",
    		pop: 13654
    	},
    	{
    		county: "Montgomery County",
    		state: "OH",
    		pop: 531687
    	},
    	{
    		county: "Morgan County",
    		state: "OH",
    		pop: 14508
    	},
    	{
    		county: "Morrow County",
    		state: "OH",
    		pop: 35328
    	},
    	{
    		county: "Muskingum County",
    		state: "OH",
    		pop: 86215
    	},
    	{
    		county: "Noble County",
    		state: "OH",
    		pop: 14424
    	},
    	{
    		county: "Ottawa County",
    		state: "OH",
    		pop: 40525
    	},
    	{
    		county: "Paulding County",
    		state: "OH",
    		pop: 18672
    	},
    	{
    		county: "Perry County",
    		state: "OH",
    		pop: 36134
    	},
    	{
    		county: "Pickaway County",
    		state: "OH",
    		pop: 58457
    	},
    	{
    		county: "Pike County",
    		state: "OH",
    		pop: 27772
    	},
    	{
    		county: "Portage County",
    		state: "OH",
    		pop: 162466
    	},
    	{
    		county: "Preble County",
    		state: "OH",
    		pop: 40882
    	},
    	{
    		county: "Putnam County",
    		state: "OH",
    		pop: 33861
    	},
    	{
    		county: "Richland County",
    		state: "OH",
    		pop: 121154
    	},
    	{
    		county: "Ross County",
    		state: "OH",
    		pop: 76666
    	},
    	{
    		county: "Sandusky County",
    		state: "OH",
    		pop: 58518
    	},
    	{
    		county: "Scioto County",
    		state: "OH",
    		pop: 75314
    	},
    	{
    		county: "Seneca County",
    		state: "OH",
    		pop: 55178
    	},
    	{
    		county: "Shelby County",
    		state: "OH",
    		pop: 48590
    	},
    	{
    		county: "Stark County",
    		state: "OH",
    		pop: 370606
    	},
    	{
    		county: "Summit County",
    		state: "OH",
    		pop: 541013
    	},
    	{
    		county: "Trumbull County",
    		state: "OH",
    		pop: 197974
    	},
    	{
    		county: "Tuscarawas County",
    		state: "OH",
    		pop: 91987
    	},
    	{
    		county: "Union County",
    		state: "OH",
    		pop: 58988
    	},
    	{
    		county: "Van Wert County",
    		state: "OH",
    		pop: 28275
    	},
    	{
    		county: "Vinton County",
    		state: "OH",
    		pop: 13085
    	},
    	{
    		county: "Warren County",
    		state: "OH",
    		pop: 234602
    	},
    	{
    		county: "Washington County",
    		state: "OH",
    		pop: 59911
    	},
    	{
    		county: "Wayne County",
    		state: "OH",
    		pop: 115710
    	},
    	{
    		county: "Williams County",
    		state: "OH",
    		pop: 36692
    	},
    	{
    		county: "Wood County",
    		state: "OH",
    		pop: 130817
    	},
    	{
    		county: "Wyandot County",
    		state: "OH",
    		pop: 21772
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "OK",
    		pop: 0
    	},
    	{
    		county: "Adair County",
    		state: "OK",
    		pop: 22194
    	},
    	{
    		county: "Alfalfa County",
    		state: "OK",
    		pop: 5702
    	},
    	{
    		county: "Atoka County",
    		state: "OK",
    		pop: 13758
    	},
    	{
    		county: "Beaver County",
    		state: "OK",
    		pop: 5311
    	},
    	{
    		county: "Beckham County",
    		state: "OK",
    		pop: 21859
    	},
    	{
    		county: "Blaine County",
    		state: "OK",
    		pop: 9429
    	},
    	{
    		county: "Bryan County",
    		state: "OK",
    		pop: 47995
    	},
    	{
    		county: "Caddo County",
    		state: "OK",
    		pop: 28762
    	},
    	{
    		county: "Canadian County",
    		state: "OK",
    		pop: 148306
    	},
    	{
    		county: "Carter County",
    		state: "OK",
    		pop: 48111
    	},
    	{
    		county: "Cherokee County",
    		state: "OK",
    		pop: 48657
    	},
    	{
    		county: "Choctaw County",
    		state: "OK",
    		pop: 14672
    	},
    	{
    		county: "Cimarron County",
    		state: "OK",
    		pop: 2137
    	},
    	{
    		county: "Cleveland County",
    		state: "OK",
    		pop: 284014
    	},
    	{
    		county: "Coal County",
    		state: "OK",
    		pop: 5495
    	},
    	{
    		county: "Comanche County",
    		state: "OK",
    		pop: 120749
    	},
    	{
    		county: "Cotton County",
    		state: "OK",
    		pop: 5666
    	},
    	{
    		county: "Craig County",
    		state: "OK",
    		pop: 14142
    	},
    	{
    		county: "Creek County",
    		state: "OK",
    		pop: 71522
    	},
    	{
    		county: "Custer County",
    		state: "OK",
    		pop: 29003
    	},
    	{
    		county: "Delaware County",
    		state: "OK",
    		pop: 43009
    	},
    	{
    		county: "Dewey County",
    		state: "OK",
    		pop: 4891
    	},
    	{
    		county: "Ellis County",
    		state: "OK",
    		pop: 3859
    	},
    	{
    		county: "Garfield County",
    		state: "OK",
    		pop: 61056
    	},
    	{
    		county: "Garvin County",
    		state: "OK",
    		pop: 27711
    	},
    	{
    		county: "Grady County",
    		state: "OK",
    		pop: 55834
    	},
    	{
    		county: "Grant County",
    		state: "OK",
    		pop: 4333
    	},
    	{
    		county: "Greer County",
    		state: "OK",
    		pop: 5712
    	},
    	{
    		county: "Harmon County",
    		state: "OK",
    		pop: 2653
    	},
    	{
    		county: "Harper County",
    		state: "OK",
    		pop: 3688
    	},
    	{
    		county: "Haskell County",
    		state: "OK",
    		pop: 12627
    	},
    	{
    		county: "Hughes County",
    		state: "OK",
    		pop: 13279
    	},
    	{
    		county: "Jackson County",
    		state: "OK",
    		pop: 24530
    	},
    	{
    		county: "Jefferson County",
    		state: "OK",
    		pop: 6002
    	},
    	{
    		county: "Johnston County",
    		state: "OK",
    		pop: 11085
    	},
    	{
    		county: "Kay County",
    		state: "OK",
    		pop: 43538
    	},
    	{
    		county: "Kingfisher County",
    		state: "OK",
    		pop: 15765
    	},
    	{
    		county: "Kiowa County",
    		state: "OK",
    		pop: 8708
    	},
    	{
    		county: "Latimer County",
    		state: "OK",
    		pop: 10073
    	},
    	{
    		county: "Le Flore County",
    		state: "OK",
    		pop: 49853
    	},
    	{
    		county: "Lincoln County",
    		state: "OK",
    		pop: 34877
    	},
    	{
    		county: "Logan County",
    		state: "OK",
    		pop: 48011
    	},
    	{
    		county: "Love County",
    		state: "OK",
    		pop: 10253
    	},
    	{
    		county: "McClain County",
    		state: "OK",
    		pop: 40474
    	},
    	{
    		county: "McCurtain County",
    		state: "OK",
    		pop: 32832
    	},
    	{
    		county: "McIntosh County",
    		state: "OK",
    		pop: 19596
    	},
    	{
    		county: "Major County",
    		state: "OK",
    		pop: 7629
    	},
    	{
    		county: "Marshall County",
    		state: "OK",
    		pop: 16931
    	},
    	{
    		county: "Mayes County",
    		state: "OK",
    		pop: 41100
    	},
    	{
    		county: "Murray County",
    		state: "OK",
    		pop: 14073
    	},
    	{
    		county: "Muskogee County",
    		state: "OK",
    		pop: 67997
    	},
    	{
    		county: "Noble County",
    		state: "OK",
    		pop: 11131
    	},
    	{
    		county: "Nowata County",
    		state: "OK",
    		pop: 10076
    	},
    	{
    		county: "Okfuskee County",
    		state: "OK",
    		pop: 11993
    	},
    	{
    		county: "Oklahoma County",
    		state: "OK",
    		pop: 797434
    	},
    	{
    		county: "Okmulgee County",
    		state: "OK",
    		pop: 38465
    	},
    	{
    		county: "Osage County",
    		state: "OK",
    		pop: 46963
    	},
    	{
    		county: "Ottawa County",
    		state: "OK",
    		pop: 31127
    	},
    	{
    		county: "Pawnee County",
    		state: "OK",
    		pop: 16376
    	},
    	{
    		county: "Payne County",
    		state: "OK",
    		pop: 81784
    	},
    	{
    		county: "Pittsburg County",
    		state: "OK",
    		pop: 43654
    	},
    	{
    		county: "Pontotoc County",
    		state: "OK",
    		pop: 38284
    	},
    	{
    		county: "Pottawatomie County",
    		state: "OK",
    		pop: 72592
    	},
    	{
    		county: "Pushmataha County",
    		state: "OK",
    		pop: 11096
    	},
    	{
    		county: "Roger Mills County",
    		state: "OK",
    		pop: 3583
    	},
    	{
    		county: "Rogers County",
    		state: "OK",
    		pop: 92459
    	},
    	{
    		county: "Seminole County",
    		state: "OK",
    		pop: 24258
    	},
    	{
    		county: "Sequoyah County",
    		state: "OK",
    		pop: 41569
    	},
    	{
    		county: "Stephens County",
    		state: "OK",
    		pop: 43143
    	},
    	{
    		county: "Texas County",
    		state: "OK",
    		pop: 19983
    	},
    	{
    		county: "Tillman County",
    		state: "OK",
    		pop: 7250
    	},
    	{
    		county: "Tulsa County",
    		state: "OK",
    		pop: 651552
    	},
    	{
    		county: "Wagoner County",
    		state: "OK",
    		pop: 81289
    	},
    	{
    		county: "Washington County",
    		state: "OK",
    		pop: 51527
    	},
    	{
    		county: "Washita County",
    		state: "OK",
    		pop: 10916
    	},
    	{
    		county: "Woods County",
    		state: "OK",
    		pop: 8793
    	},
    	{
    		county: "Woodward County",
    		state: "OK",
    		pop: 20211
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "OR",
    		pop: 0
    	},
    	{
    		county: "Baker County",
    		state: "OR",
    		pop: 16124
    	},
    	{
    		county: "Benton County",
    		state: "OR",
    		pop: 93053
    	},
    	{
    		county: "Clackamas County",
    		state: "OR",
    		pop: 418187
    	},
    	{
    		county: "Clatsop County",
    		state: "OR",
    		pop: 40224
    	},
    	{
    		county: "Columbia County",
    		state: "OR",
    		pop: 52354
    	},
    	{
    		county: "Coos County",
    		state: "OR",
    		pop: 64487
    	},
    	{
    		county: "Crook County",
    		state: "OR",
    		pop: 24404
    	},
    	{
    		county: "Curry County",
    		state: "OR",
    		pop: 22925
    	},
    	{
    		county: "Deschutes County",
    		state: "OR",
    		pop: 197692
    	},
    	{
    		county: "Douglas County",
    		state: "OR",
    		pop: 110980
    	},
    	{
    		county: "Gilliam County",
    		state: "OR",
    		pop: 1912
    	},
    	{
    		county: "Grant County",
    		state: "OR",
    		pop: 7199
    	},
    	{
    		county: "Harney County",
    		state: "OR",
    		pop: 7393
    	},
    	{
    		county: "Hood River County",
    		state: "OR",
    		pop: 23382
    	},
    	{
    		county: "Jackson County",
    		state: "OR",
    		pop: 220944
    	},
    	{
    		county: "Jefferson County",
    		state: "OR",
    		pop: 24658
    	},
    	{
    		county: "Josephine County",
    		state: "OR",
    		pop: 87487
    	},
    	{
    		county: "Klamath County",
    		state: "OR",
    		pop: 68238
    	},
    	{
    		county: "Lake County",
    		state: "OR",
    		pop: 7869
    	},
    	{
    		county: "Lane County",
    		state: "OR",
    		pop: 382067
    	},
    	{
    		county: "Lincoln County",
    		state: "OR",
    		pop: 49962
    	},
    	{
    		county: "Linn County",
    		state: "OR",
    		pop: 129749
    	},
    	{
    		county: "Malheur County",
    		state: "OR",
    		pop: 30571
    	},
    	{
    		county: "Marion County",
    		state: "OR",
    		pop: 347818
    	},
    	{
    		county: "Morrow County",
    		state: "OR",
    		pop: 11603
    	},
    	{
    		county: "Multnomah County",
    		state: "OR",
    		pop: 812855
    	},
    	{
    		county: "Polk County",
    		state: "OR",
    		pop: 86085
    	},
    	{
    		county: "Sherman County",
    		state: "OR",
    		pop: 1780
    	},
    	{
    		county: "Tillamook County",
    		state: "OR",
    		pop: 27036
    	},
    	{
    		county: "Umatilla County",
    		state: "OR",
    		pop: 77950
    	},
    	{
    		county: "Union County",
    		state: "OR",
    		pop: 26835
    	},
    	{
    		county: "Wallowa County",
    		state: "OR",
    		pop: 7208
    	},
    	{
    		county: "Wasco County",
    		state: "OR",
    		pop: 26682
    	},
    	{
    		county: "Washington County",
    		state: "OR",
    		pop: 601592
    	},
    	{
    		county: "Wheeler County",
    		state: "OR",
    		pop: 1332
    	},
    	{
    		county: "Yamhill County",
    		state: "OR",
    		pop: 107100
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "PA",
    		pop: 0
    	},
    	{
    		county: "Adams County",
    		state: "PA",
    		pop: 103009
    	},
    	{
    		county: "Allegheny County",
    		state: "PA",
    		pop: 1216045
    	},
    	{
    		county: "Armstrong County",
    		state: "PA",
    		pop: 64735
    	},
    	{
    		county: "Beaver County",
    		state: "PA",
    		pop: 163929
    	},
    	{
    		county: "Bedford County",
    		state: "PA",
    		pop: 47888
    	},
    	{
    		county: "Berks County",
    		state: "PA",
    		pop: 421164
    	},
    	{
    		county: "Blair County",
    		state: "PA",
    		pop: 121829
    	},
    	{
    		county: "Bradford County",
    		state: "PA",
    		pop: 60323
    	},
    	{
    		county: "Bucks County",
    		state: "PA",
    		pop: 628270
    	},
    	{
    		county: "Butler County",
    		state: "PA",
    		pop: 187853
    	},
    	{
    		county: "Cambria County",
    		state: "PA",
    		pop: 130192
    	},
    	{
    		county: "Cameron County",
    		state: "PA",
    		pop: 4447
    	},
    	{
    		county: "Carbon County",
    		state: "PA",
    		pop: 64182
    	},
    	{
    		county: "Centre County",
    		state: "PA",
    		pop: 162385
    	},
    	{
    		county: "Chester County",
    		state: "PA",
    		pop: 524989
    	},
    	{
    		county: "Clarion County",
    		state: "PA",
    		pop: 38438
    	},
    	{
    		county: "Clearfield County",
    		state: "PA",
    		pop: 79255
    	},
    	{
    		county: "Clinton County",
    		state: "PA",
    		pop: 38632
    	},
    	{
    		county: "Columbia County",
    		state: "PA",
    		pop: 64964
    	},
    	{
    		county: "Crawford County",
    		state: "PA",
    		pop: 84629
    	},
    	{
    		county: "Cumberland County",
    		state: "PA",
    		pop: 253370
    	},
    	{
    		county: "Dauphin County",
    		state: "PA",
    		pop: 278299
    	},
    	{
    		county: "Delaware County",
    		state: "PA",
    		pop: 566747
    	},
    	{
    		county: "Elk County",
    		state: "PA",
    		pop: 29910
    	},
    	{
    		county: "Erie County",
    		state: "PA",
    		pop: 269728
    	},
    	{
    		county: "Fayette County",
    		state: "PA",
    		pop: 129274
    	},
    	{
    		county: "Forest County",
    		state: "PA",
    		pop: 7247
    	},
    	{
    		county: "Franklin County",
    		state: "PA",
    		pop: 155027
    	},
    	{
    		county: "Fulton County",
    		state: "PA",
    		pop: 14530
    	},
    	{
    		county: "Greene County",
    		state: "PA",
    		pop: 36233
    	},
    	{
    		county: "Huntingdon County",
    		state: "PA",
    		pop: 45144
    	},
    	{
    		county: "Indiana County",
    		state: "PA",
    		pop: 84073
    	},
    	{
    		county: "Jefferson County",
    		state: "PA",
    		pop: 43425
    	},
    	{
    		county: "Juniata County",
    		state: "PA",
    		pop: 24763
    	},
    	{
    		county: "Lackawanna County",
    		state: "PA",
    		pop: 209674
    	},
    	{
    		county: "Lancaster County",
    		state: "PA",
    		pop: 545724
    	},
    	{
    		county: "Lawrence County",
    		state: "PA",
    		pop: 85512
    	},
    	{
    		county: "Lebanon County",
    		state: "PA",
    		pop: 141793
    	},
    	{
    		county: "Lehigh County",
    		state: "PA",
    		pop: 369318
    	},
    	{
    		county: "Luzerne County",
    		state: "PA",
    		pop: 317417
    	},
    	{
    		county: "Lycoming County",
    		state: "PA",
    		pop: 113299
    	},
    	{
    		county: "McKean County",
    		state: "PA",
    		pop: 40625
    	},
    	{
    		county: "Mercer County",
    		state: "PA",
    		pop: 109424
    	},
    	{
    		county: "Mifflin County",
    		state: "PA",
    		pop: 46138
    	},
    	{
    		county: "Monroe County",
    		state: "PA",
    		pop: 170271
    	},
    	{
    		county: "Montgomery County",
    		state: "PA",
    		pop: 830915
    	},
    	{
    		county: "Montour County",
    		state: "PA",
    		pop: 18230
    	},
    	{
    		county: "Northampton County",
    		state: "PA",
    		pop: 305285
    	},
    	{
    		county: "Northumberland County",
    		state: "PA",
    		pop: 90843
    	},
    	{
    		county: "Perry County",
    		state: "PA",
    		pop: 46272
    	},
    	{
    		county: "Philadelphia County",
    		state: "PA",
    		pop: 1584064
    	},
    	{
    		county: "Pike County",
    		state: "PA",
    		pop: 55809
    	},
    	{
    		county: "Potter County",
    		state: "PA",
    		pop: 16526
    	},
    	{
    		county: "Schuylkill County",
    		state: "PA",
    		pop: 141359
    	},
    	{
    		county: "Snyder County",
    		state: "PA",
    		pop: 40372
    	},
    	{
    		county: "Somerset County",
    		state: "PA",
    		pop: 73447
    	},
    	{
    		county: "Sullivan County",
    		state: "PA",
    		pop: 6066
    	},
    	{
    		county: "Susquehanna County",
    		state: "PA",
    		pop: 40328
    	},
    	{
    		county: "Tioga County",
    		state: "PA",
    		pop: 40591
    	},
    	{
    		county: "Union County",
    		state: "PA",
    		pop: 44923
    	},
    	{
    		county: "Venango County",
    		state: "PA",
    		pop: 50668
    	},
    	{
    		county: "Warren County",
    		state: "PA",
    		pop: 39191
    	},
    	{
    		county: "Washington County",
    		state: "PA",
    		pop: 206865
    	},
    	{
    		county: "Wayne County",
    		state: "PA",
    		pop: 51361
    	},
    	{
    		county: "Westmoreland County",
    		state: "PA",
    		pop: 348899
    	},
    	{
    		county: "Wyoming County",
    		state: "PA",
    		pop: 26794
    	},
    	{
    		county: "York County",
    		state: "PA",
    		pop: 449058
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "RI",
    		pop: 0
    	},
    	{
    		county: "Bristol County",
    		state: "RI",
    		pop: 48479
    	},
    	{
    		county: "Kent County",
    		state: "RI",
    		pop: 164292
    	},
    	{
    		county: "Newport County",
    		state: "RI",
    		pop: 82082
    	},
    	{
    		county: "Providence County",
    		state: "RI",
    		pop: 638931
    	},
    	{
    		county: "Washington County",
    		state: "RI",
    		pop: 125577
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "SC",
    		pop: 0
    	},
    	{
    		county: "Abbeville County",
    		state: "SC",
    		pop: 24527
    	},
    	{
    		county: "Aiken County",
    		state: "SC",
    		pop: 170872
    	},
    	{
    		county: "Allendale County",
    		state: "SC",
    		pop: 8688
    	},
    	{
    		county: "Anderson County",
    		state: "SC",
    		pop: 202558
    	},
    	{
    		county: "Bamberg County",
    		state: "SC",
    		pop: 14066
    	},
    	{
    		county: "Barnwell County",
    		state: "SC",
    		pop: 20866
    	},
    	{
    		county: "Beaufort County",
    		state: "SC",
    		pop: 192122
    	},
    	{
    		county: "Berkeley County",
    		state: "SC",
    		pop: 227907
    	},
    	{
    		county: "Calhoun County",
    		state: "SC",
    		pop: 14553
    	},
    	{
    		county: "Charleston County",
    		state: "SC",
    		pop: 411406
    	},
    	{
    		county: "Cherokee County",
    		state: "SC",
    		pop: 57300
    	},
    	{
    		county: "Chester County",
    		state: "SC",
    		pop: 32244
    	},
    	{
    		county: "Chesterfield County",
    		state: "SC",
    		pop: 45650
    	},
    	{
    		county: "Clarendon County",
    		state: "SC",
    		pop: 33745
    	},
    	{
    		county: "Colleton County",
    		state: "SC",
    		pop: 37677
    	},
    	{
    		county: "Darlington County",
    		state: "SC",
    		pop: 66618
    	},
    	{
    		county: "Dillon County",
    		state: "SC",
    		pop: 30479
    	},
    	{
    		county: "Dorchester County",
    		state: "SC",
    		pop: 162809
    	},
    	{
    		county: "Edgefield County",
    		state: "SC",
    		pop: 27260
    	},
    	{
    		county: "Fairfield County",
    		state: "SC",
    		pop: 22347
    	},
    	{
    		county: "Florence County",
    		state: "SC",
    		pop: 138293
    	},
    	{
    		county: "Georgetown County",
    		state: "SC",
    		pop: 62680
    	},
    	{
    		county: "Greenville County",
    		state: "SC",
    		pop: 523542
    	},
    	{
    		county: "Greenwood County",
    		state: "SC",
    		pop: 70811
    	},
    	{
    		county: "Hampton County",
    		state: "SC",
    		pop: 19222
    	},
    	{
    		county: "Horry County",
    		state: "SC",
    		pop: 354081
    	},
    	{
    		county: "Jasper County",
    		state: "SC",
    		pop: 30073
    	},
    	{
    		county: "Kershaw County",
    		state: "SC",
    		pop: 66551
    	},
    	{
    		county: "Lancaster County",
    		state: "SC",
    		pop: 98012
    	},
    	{
    		county: "Laurens County",
    		state: "SC",
    		pop: 67493
    	},
    	{
    		county: "Lee County",
    		state: "SC",
    		pop: 16828
    	},
    	{
    		county: "Lexington County",
    		state: "SC",
    		pop: 298750
    	},
    	{
    		county: "McCormick County",
    		state: "SC",
    		pop: 9463
    	},
    	{
    		county: "Marion County",
    		state: "SC",
    		pop: 30657
    	},
    	{
    		county: "Marlboro County",
    		state: "SC",
    		pop: 26118
    	},
    	{
    		county: "Newberry County",
    		state: "SC",
    		pop: 38440
    	},
    	{
    		county: "Oconee County",
    		state: "SC",
    		pop: 79546
    	},
    	{
    		county: "Orangeburg County",
    		state: "SC",
    		pop: 86175
    	},
    	{
    		county: "Pickens County",
    		state: "SC",
    		pop: 126884
    	},
    	{
    		county: "Richland County",
    		state: "SC",
    		pop: 415759
    	},
    	{
    		county: "Saluda County",
    		state: "SC",
    		pop: 20473
    	},
    	{
    		county: "Spartanburg County",
    		state: "SC",
    		pop: 319785
    	},
    	{
    		county: "Sumter County",
    		state: "SC",
    		pop: 106721
    	},
    	{
    		county: "Union County",
    		state: "SC",
    		pop: 27316
    	},
    	{
    		county: "Williamsburg County",
    		state: "SC",
    		pop: 30368
    	},
    	{
    		county: "York County",
    		state: "SC",
    		pop: 280979
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "SD",
    		pop: 0
    	},
    	{
    		county: "Aurora County",
    		state: "SD",
    		pop: 2751
    	},
    	{
    		county: "Beadle County",
    		state: "SD",
    		pop: 18453
    	},
    	{
    		county: "Bennett County",
    		state: "SD",
    		pop: 3365
    	},
    	{
    		county: "Bon Homme County",
    		state: "SD",
    		pop: 6901
    	},
    	{
    		county: "Brookings County",
    		state: "SD",
    		pop: 35077
    	},
    	{
    		county: "Brown County",
    		state: "SD",
    		pop: 38839
    	},
    	{
    		county: "Brule County",
    		state: "SD",
    		pop: 5297
    	},
    	{
    		county: "Buffalo County",
    		state: "SD",
    		pop: 1962
    	},
    	{
    		county: "Butte County",
    		state: "SD",
    		pop: 10429
    	},
    	{
    		county: "Campbell County",
    		state: "SD",
    		pop: 1376
    	},
    	{
    		county: "Charles Mix County",
    		state: "SD",
    		pop: 9292
    	},
    	{
    		county: "Clark County",
    		state: "SD",
    		pop: 3736
    	},
    	{
    		county: "Clay County",
    		state: "SD",
    		pop: 14070
    	},
    	{
    		county: "Codington County",
    		state: "SD",
    		pop: 28009
    	},
    	{
    		county: "Corson County",
    		state: "SD",
    		pop: 4086
    	},
    	{
    		county: "Custer County",
    		state: "SD",
    		pop: 8972
    	},
    	{
    		county: "Davison County",
    		state: "SD",
    		pop: 19775
    	},
    	{
    		county: "Day County",
    		state: "SD",
    		pop: 5424
    	},
    	{
    		county: "Deuel County",
    		state: "SD",
    		pop: 4351
    	},
    	{
    		county: "Dewey County",
    		state: "SD",
    		pop: 5892
    	},
    	{
    		county: "Douglas County",
    		state: "SD",
    		pop: 2921
    	},
    	{
    		county: "Edmunds County",
    		state: "SD",
    		pop: 3829
    	},
    	{
    		county: "Fall River County",
    		state: "SD",
    		pop: 6713
    	},
    	{
    		county: "Faulk County",
    		state: "SD",
    		pop: 2299
    	},
    	{
    		county: "Grant County",
    		state: "SD",
    		pop: 7052
    	},
    	{
    		county: "Gregory County",
    		state: "SD",
    		pop: 4185
    	},
    	{
    		county: "Haakon County",
    		state: "SD",
    		pop: 1899
    	},
    	{
    		county: "Hamlin County",
    		state: "SD",
    		pop: 6164
    	},
    	{
    		county: "Hand County",
    		state: "SD",
    		pop: 3191
    	},
    	{
    		county: "Hanson County",
    		state: "SD",
    		pop: 3453
    	},
    	{
    		county: "Harding County",
    		state: "SD",
    		pop: 1298
    	},
    	{
    		county: "Hughes County",
    		state: "SD",
    		pop: 17526
    	},
    	{
    		county: "Hutchinson County",
    		state: "SD",
    		pop: 7291
    	},
    	{
    		county: "Hyde County",
    		state: "SD",
    		pop: 1301
    	},
    	{
    		county: "Jackson County",
    		state: "SD",
    		pop: 3344
    	},
    	{
    		county: "Jerauld County",
    		state: "SD",
    		pop: 2013
    	},
    	{
    		county: "Jones County",
    		state: "SD",
    		pop: 903
    	},
    	{
    		county: "Kingsbury County",
    		state: "SD",
    		pop: 4939
    	},
    	{
    		county: "Lake County",
    		state: "SD",
    		pop: 12797
    	},
    	{
    		county: "Lawrence County",
    		state: "SD",
    		pop: 25844
    	},
    	{
    		county: "Lincoln County",
    		state: "SD",
    		pop: 61128
    	},
    	{
    		county: "Lyman County",
    		state: "SD",
    		pop: 3781
    	},
    	{
    		county: "McCook County",
    		state: "SD",
    		pop: 5586
    	},
    	{
    		county: "McPherson County",
    		state: "SD",
    		pop: 2379
    	},
    	{
    		county: "Marshall County",
    		state: "SD",
    		pop: 4935
    	},
    	{
    		county: "Meade County",
    		state: "SD",
    		pop: 28332
    	},
    	{
    		county: "Mellette County",
    		state: "SD",
    		pop: 2061
    	},
    	{
    		county: "Miner County",
    		state: "SD",
    		pop: 2216
    	},
    	{
    		county: "Minnehaha County",
    		state: "SD",
    		pop: 193134
    	},
    	{
    		county: "Moody County",
    		state: "SD",
    		pop: 6576
    	},
    	{
    		county: "Oglala Lakota County",
    		state: "SD",
    		pop: 14177
    	},
    	{
    		county: "Pennington County",
    		state: "SD",
    		pop: 113775
    	},
    	{
    		county: "Perkins County",
    		state: "SD",
    		pop: 2865
    	},
    	{
    		county: "Potter County",
    		state: "SD",
    		pop: 2153
    	},
    	{
    		county: "Roberts County",
    		state: "SD",
    		pop: 10394
    	},
    	{
    		county: "Sanborn County",
    		state: "SD",
    		pop: 2344
    	},
    	{
    		county: "Spink County",
    		state: "SD",
    		pop: 6376
    	},
    	{
    		county: "Stanley County",
    		state: "SD",
    		pop: 3098
    	},
    	{
    		county: "Sully County",
    		state: "SD",
    		pop: 1391
    	},
    	{
    		county: "Todd County",
    		state: "SD",
    		pop: 10177
    	},
    	{
    		county: "Tripp County",
    		state: "SD",
    		pop: 5441
    	},
    	{
    		county: "Turner County",
    		state: "SD",
    		pop: 8384
    	},
    	{
    		county: "Union County",
    		state: "SD",
    		pop: 15932
    	},
    	{
    		county: "Walworth County",
    		state: "SD",
    		pop: 5435
    	},
    	{
    		county: "Yankton County",
    		state: "SD",
    		pop: 22814
    	},
    	{
    		county: "Ziebach County",
    		state: "SD",
    		pop: 2756
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "TN",
    		pop: 0
    	},
    	{
    		county: "Anderson County",
    		state: "TN",
    		pop: 76978
    	},
    	{
    		county: "Bedford County",
    		state: "TN",
    		pop: 49713
    	},
    	{
    		county: "Benton County",
    		state: "TN",
    		pop: 16160
    	},
    	{
    		county: "Bledsoe County",
    		state: "TN",
    		pop: 15064
    	},
    	{
    		county: "Blount County",
    		state: "TN",
    		pop: 133088
    	},
    	{
    		county: "Bradley County",
    		state: "TN",
    		pop: 108110
    	},
    	{
    		county: "Campbell County",
    		state: "TN",
    		pop: 39842
    	},
    	{
    		county: "Cannon County",
    		state: "TN",
    		pop: 14678
    	},
    	{
    		county: "Carroll County",
    		state: "TN",
    		pop: 27767
    	},
    	{
    		county: "Carter County",
    		state: "TN",
    		pop: 56391
    	},
    	{
    		county: "Cheatham County",
    		state: "TN",
    		pop: 40667
    	},
    	{
    		county: "Chester County",
    		state: "TN",
    		pop: 17297
    	},
    	{
    		county: "Claiborne County",
    		state: "TN",
    		pop: 31959
    	},
    	{
    		county: "Clay County",
    		state: "TN",
    		pop: 7615
    	},
    	{
    		county: "Cocke County",
    		state: "TN",
    		pop: 36004
    	},
    	{
    		county: "Coffee County",
    		state: "TN",
    		pop: 56520
    	},
    	{
    		county: "Crockett County",
    		state: "TN",
    		pop: 14230
    	},
    	{
    		county: "Cumberland County",
    		state: "TN",
    		pop: 60520
    	},
    	{
    		county: "Davidson County",
    		state: "TN",
    		pop: 694144
    	},
    	{
    		county: "Decatur County",
    		state: "TN",
    		pop: 11663
    	},
    	{
    		county: "DeKalb County",
    		state: "TN",
    		pop: 20490
    	},
    	{
    		county: "Dickson County",
    		state: "TN",
    		pop: 53948
    	},
    	{
    		county: "Dyer County",
    		state: "TN",
    		pop: 37159
    	},
    	{
    		county: "Fayette County",
    		state: "TN",
    		pop: 41133
    	},
    	{
    		county: "Fentress County",
    		state: "TN",
    		pop: 18523
    	},
    	{
    		county: "Franklin County",
    		state: "TN",
    		pop: 42208
    	},
    	{
    		county: "Gibson County",
    		state: "TN",
    		pop: 49133
    	},
    	{
    		county: "Giles County",
    		state: "TN",
    		pop: 29464
    	},
    	{
    		county: "Grainger County",
    		state: "TN",
    		pop: 23320
    	},
    	{
    		county: "Greene County",
    		state: "TN",
    		pop: 69069
    	},
    	{
    		county: "Grundy County",
    		state: "TN",
    		pop: 13427
    	},
    	{
    		county: "Hamblen County",
    		state: "TN",
    		pop: 64934
    	},
    	{
    		county: "Hamilton County",
    		state: "TN",
    		pop: 367804
    	},
    	{
    		county: "Hancock County",
    		state: "TN",
    		pop: 6620
    	},
    	{
    		county: "Hardeman County",
    		state: "TN",
    		pop: 25050
    	},
    	{
    		county: "Hardin County",
    		state: "TN",
    		pop: 25652
    	},
    	{
    		county: "Hawkins County",
    		state: "TN",
    		pop: 56786
    	},
    	{
    		county: "Haywood County",
    		state: "TN",
    		pop: 17304
    	},
    	{
    		county: "Henderson County",
    		state: "TN",
    		pop: 28117
    	},
    	{
    		county: "Henry County",
    		state: "TN",
    		pop: 32345
    	},
    	{
    		county: "Hickman County",
    		state: "TN",
    		pop: 25178
    	},
    	{
    		county: "Houston County",
    		state: "TN",
    		pop: 8201
    	},
    	{
    		county: "Humphreys County",
    		state: "TN",
    		pop: 18582
    	},
    	{
    		county: "Jackson County",
    		state: "TN",
    		pop: 11786
    	},
    	{
    		county: "Jefferson County",
    		state: "TN",
    		pop: 54495
    	},
    	{
    		county: "Johnson County",
    		state: "TN",
    		pop: 17788
    	},
    	{
    		county: "Knox County",
    		state: "TN",
    		pop: 470313
    	},
    	{
    		county: "Lake County",
    		state: "TN",
    		pop: 7016
    	},
    	{
    		county: "Lauderdale County",
    		state: "TN",
    		pop: 25633
    	},
    	{
    		county: "Lawrence County",
    		state: "TN",
    		pop: 44142
    	},
    	{
    		county: "Lewis County",
    		state: "TN",
    		pop: 12268
    	},
    	{
    		county: "Lincoln County",
    		state: "TN",
    		pop: 34366
    	},
    	{
    		county: "Loudon County",
    		state: "TN",
    		pop: 54068
    	},
    	{
    		county: "McMinn County",
    		state: "TN",
    		pop: 53794
    	},
    	{
    		county: "McNairy County",
    		state: "TN",
    		pop: 25694
    	},
    	{
    		county: "Macon County",
    		state: "TN",
    		pop: 24602
    	},
    	{
    		county: "Madison County",
    		state: "TN",
    		pop: 97984
    	},
    	{
    		county: "Marion County",
    		state: "TN",
    		pop: 28907
    	},
    	{
    		county: "Marshall County",
    		state: "TN",
    		pop: 34375
    	},
    	{
    		county: "Maury County",
    		state: "TN",
    		pop: 96387
    	},
    	{
    		county: "Meigs County",
    		state: "TN",
    		pop: 12422
    	},
    	{
    		county: "Monroe County",
    		state: "TN",
    		pop: 46545
    	},
    	{
    		county: "Montgomery County",
    		state: "TN",
    		pop: 208993
    	},
    	{
    		county: "Moore County",
    		state: "TN",
    		pop: 6488
    	},
    	{
    		county: "Morgan County",
    		state: "TN",
    		pop: 21403
    	},
    	{
    		county: "Obion County",
    		state: "TN",
    		pop: 30069
    	},
    	{
    		county: "Overton County",
    		state: "TN",
    		pop: 22241
    	},
    	{
    		county: "Perry County",
    		state: "TN",
    		pop: 8076
    	},
    	{
    		county: "Pickett County",
    		state: "TN",
    		pop: 5048
    	},
    	{
    		county: "Polk County",
    		state: "TN",
    		pop: 16832
    	},
    	{
    		county: "Putnam County",
    		state: "TN",
    		pop: 80245
    	},
    	{
    		county: "Rhea County",
    		state: "TN",
    		pop: 33167
    	},
    	{
    		county: "Roane County",
    		state: "TN",
    		pop: 53382
    	},
    	{
    		county: "Robertson County",
    		state: "TN",
    		pop: 71813
    	},
    	{
    		county: "Rutherford County",
    		state: "TN",
    		pop: 332285
    	},
    	{
    		county: "Scott County",
    		state: "TN",
    		pop: 22068
    	},
    	{
    		county: "Sequatchie County",
    		state: "TN",
    		pop: 15026
    	},
    	{
    		county: "Sevier County",
    		state: "TN",
    		pop: 98250
    	},
    	{
    		county: "Shelby County",
    		state: "TN",
    		pop: 937166
    	},
    	{
    		county: "Smith County",
    		state: "TN",
    		pop: 20157
    	},
    	{
    		county: "Stewart County",
    		state: "TN",
    		pop: 13715
    	},
    	{
    		county: "Sullivan County",
    		state: "TN",
    		pop: 158348
    	},
    	{
    		county: "Sumner County",
    		state: "TN",
    		pop: 191283
    	},
    	{
    		county: "Tipton County",
    		state: "TN",
    		pop: 61599
    	},
    	{
    		county: "Trousdale County",
    		state: "TN",
    		pop: 11284
    	},
    	{
    		county: "Unicoi County",
    		state: "TN",
    		pop: 17883
    	},
    	{
    		county: "Union County",
    		state: "TN",
    		pop: 19972
    	},
    	{
    		county: "Van Buren County",
    		state: "TN",
    		pop: 5872
    	},
    	{
    		county: "Warren County",
    		state: "TN",
    		pop: 41277
    	},
    	{
    		county: "Washington County",
    		state: "TN",
    		pop: 129375
    	},
    	{
    		county: "Wayne County",
    		state: "TN",
    		pop: 16673
    	},
    	{
    		county: "Weakley County",
    		state: "TN",
    		pop: 33328
    	},
    	{
    		county: "White County",
    		state: "TN",
    		pop: 27345
    	},
    	{
    		county: "Williamson County",
    		state: "TN",
    		pop: 238412
    	},
    	{
    		county: "Wilson County",
    		state: "TN",
    		pop: 144657
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "TX",
    		pop: 0
    	},
    	{
    		county: "Anderson County",
    		state: "TX",
    		pop: 57735
    	},
    	{
    		county: "Andrews County",
    		state: "TX",
    		pop: 18705
    	},
    	{
    		county: "Angelina County",
    		state: "TX",
    		pop: 86715
    	},
    	{
    		county: "Aransas County",
    		state: "TX",
    		pop: 23510
    	},
    	{
    		county: "Archer County",
    		state: "TX",
    		pop: 8553
    	},
    	{
    		county: "Armstrong County",
    		state: "TX",
    		pop: 1887
    	},
    	{
    		county: "Atascosa County",
    		state: "TX",
    		pop: 51153
    	},
    	{
    		county: "Austin County",
    		state: "TX",
    		pop: 30032
    	},
    	{
    		county: "Bailey County",
    		state: "TX",
    		pop: 7000
    	},
    	{
    		county: "Bandera County",
    		state: "TX",
    		pop: 23112
    	},
    	{
    		county: "Bastrop County",
    		state: "TX",
    		pop: 88723
    	},
    	{
    		county: "Baylor County",
    		state: "TX",
    		pop: 3509
    	},
    	{
    		county: "Bee County",
    		state: "TX",
    		pop: 32565
    	},
    	{
    		county: "Bell County",
    		state: "TX",
    		pop: 362924
    	},
    	{
    		county: "Bexar County",
    		state: "TX",
    		pop: 2003554
    	},
    	{
    		county: "Blanco County",
    		state: "TX",
    		pop: 11931
    	},
    	{
    		county: "Borden County",
    		state: "TX",
    		pop: 654
    	},
    	{
    		county: "Bosque County",
    		state: "TX",
    		pop: 18685
    	},
    	{
    		county: "Bowie County",
    		state: "TX",
    		pop: 93245
    	},
    	{
    		county: "Brazoria County",
    		state: "TX",
    		pop: 374264
    	},
    	{
    		county: "Brazos County",
    		state: "TX",
    		pop: 229211
    	},
    	{
    		county: "Brewster County",
    		state: "TX",
    		pop: 9203
    	},
    	{
    		county: "Briscoe County",
    		state: "TX",
    		pop: 1546
    	},
    	{
    		county: "Brooks County",
    		state: "TX",
    		pop: 7093
    	},
    	{
    		county: "Brown County",
    		state: "TX",
    		pop: 37864
    	},
    	{
    		county: "Burleson County",
    		state: "TX",
    		pop: 18443
    	},
    	{
    		county: "Burnet County",
    		state: "TX",
    		pop: 48155
    	},
    	{
    		county: "Caldwell County",
    		state: "TX",
    		pop: 43664
    	},
    	{
    		county: "Calhoun County",
    		state: "TX",
    		pop: 21290
    	},
    	{
    		county: "Callahan County",
    		state: "TX",
    		pop: 13943
    	},
    	{
    		county: "Cameron County",
    		state: "TX",
    		pop: 423163
    	},
    	{
    		county: "Camp County",
    		state: "TX",
    		pop: 13094
    	},
    	{
    		county: "Carson County",
    		state: "TX",
    		pop: 5926
    	},
    	{
    		county: "Cass County",
    		state: "TX",
    		pop: 30026
    	},
    	{
    		county: "Castro County",
    		state: "TX",
    		pop: 7530
    	},
    	{
    		county: "Chambers County",
    		state: "TX",
    		pop: 43837
    	},
    	{
    		county: "Cherokee County",
    		state: "TX",
    		pop: 52646
    	},
    	{
    		county: "Childress County",
    		state: "TX",
    		pop: 7306
    	},
    	{
    		county: "Clay County",
    		state: "TX",
    		pop: 10471
    	},
    	{
    		county: "Cochran County",
    		state: "TX",
    		pop: 2853
    	},
    	{
    		county: "Coke County",
    		state: "TX",
    		pop: 3387
    	},
    	{
    		county: "Coleman County",
    		state: "TX",
    		pop: 8175
    	},
    	{
    		county: "Collin County",
    		state: "TX",
    		pop: 1034730
    	},
    	{
    		county: "Collingsworth County",
    		state: "TX",
    		pop: 2920
    	},
    	{
    		county: "Colorado County",
    		state: "TX",
    		pop: 21493
    	},
    	{
    		county: "Comal County",
    		state: "TX",
    		pop: 156209
    	},
    	{
    		county: "Comanche County",
    		state: "TX",
    		pop: 13635
    	},
    	{
    		county: "Concho County",
    		state: "TX",
    		pop: 2726
    	},
    	{
    		county: "Cooke County",
    		state: "TX",
    		pop: 41257
    	},
    	{
    		county: "Coryell County",
    		state: "TX",
    		pop: 75951
    	},
    	{
    		county: "Cottle County",
    		state: "TX",
    		pop: 1398
    	},
    	{
    		county: "Crane County",
    		state: "TX",
    		pop: 4797
    	},
    	{
    		county: "Crockett County",
    		state: "TX",
    		pop: 3464
    	},
    	{
    		county: "Crosby County",
    		state: "TX",
    		pop: 5737
    	},
    	{
    		county: "Culberson County",
    		state: "TX",
    		pop: 2171
    	},
    	{
    		county: "Dallam County",
    		state: "TX",
    		pop: 7287
    	},
    	{
    		county: "Dallas County",
    		state: "TX",
    		pop: 2635516
    	},
    	{
    		county: "Dawson County",
    		state: "TX",
    		pop: 12728
    	},
    	{
    		county: "Deaf Smith County",
    		state: "TX",
    		pop: 18546
    	},
    	{
    		county: "Delta County",
    		state: "TX",
    		pop: 5331
    	},
    	{
    		county: "Denton County",
    		state: "TX",
    		pop: 887207
    	},
    	{
    		county: "DeWitt County",
    		state: "TX",
    		pop: 20160
    	},
    	{
    		county: "Dickens County",
    		state: "TX",
    		pop: 2211
    	},
    	{
    		county: "Dimmit County",
    		state: "TX",
    		pop: 10124
    	},
    	{
    		county: "Donley County",
    		state: "TX",
    		pop: 3278
    	},
    	{
    		county: "Duval County",
    		state: "TX",
    		pop: 11157
    	},
    	{
    		county: "Eastland County",
    		state: "TX",
    		pop: 18360
    	},
    	{
    		county: "Ector County",
    		state: "TX",
    		pop: 166223
    	},
    	{
    		county: "Edwards County",
    		state: "TX",
    		pop: 1932
    	},
    	{
    		county: "Ellis County",
    		state: "TX",
    		pop: 184826
    	},
    	{
    		county: "El Paso County",
    		state: "TX",
    		pop: 839238
    	},
    	{
    		county: "Erath County",
    		state: "TX",
    		pop: 42698
    	},
    	{
    		county: "Falls County",
    		state: "TX",
    		pop: 17297
    	},
    	{
    		county: "Fannin County",
    		state: "TX",
    		pop: 35514
    	},
    	{
    		county: "Fayette County",
    		state: "TX",
    		pop: 25346
    	},
    	{
    		county: "Fisher County",
    		state: "TX",
    		pop: 3830
    	},
    	{
    		county: "Floyd County",
    		state: "TX",
    		pop: 5712
    	},
    	{
    		county: "Foard County",
    		state: "TX",
    		pop: 1155
    	},
    	{
    		county: "Fort Bend County",
    		state: "TX",
    		pop: 811688
    	},
    	{
    		county: "Franklin County",
    		state: "TX",
    		pop: 10725
    	},
    	{
    		county: "Freestone County",
    		state: "TX",
    		pop: 19717
    	},
    	{
    		county: "Frio County",
    		state: "TX",
    		pop: 20306
    	},
    	{
    		county: "Gaines County",
    		state: "TX",
    		pop: 21492
    	},
    	{
    		county: "Galveston County",
    		state: "TX",
    		pop: 342139
    	},
    	{
    		county: "Garza County",
    		state: "TX",
    		pop: 6229
    	},
    	{
    		county: "Gillespie County",
    		state: "TX",
    		pop: 26988
    	},
    	{
    		county: "Glasscock County",
    		state: "TX",
    		pop: 1409
    	},
    	{
    		county: "Goliad County",
    		state: "TX",
    		pop: 7658
    	},
    	{
    		county: "Gonzales County",
    		state: "TX",
    		pop: 20837
    	},
    	{
    		county: "Gray County",
    		state: "TX",
    		pop: 21886
    	},
    	{
    		county: "Grayson County",
    		state: "TX",
    		pop: 136212
    	},
    	{
    		county: "Gregg County",
    		state: "TX",
    		pop: 123945
    	},
    	{
    		county: "Grimes County",
    		state: "TX",
    		pop: 28880
    	},
    	{
    		county: "Guadalupe County",
    		state: "TX",
    		pop: 166847
    	},
    	{
    		county: "Hale County",
    		state: "TX",
    		pop: 33406
    	},
    	{
    		county: "Hall County",
    		state: "TX",
    		pop: 2964
    	},
    	{
    		county: "Hamilton County",
    		state: "TX",
    		pop: 8461
    	},
    	{
    		county: "Hansford County",
    		state: "TX",
    		pop: 5399
    	},
    	{
    		county: "Hardeman County",
    		state: "TX",
    		pop: 3933
    	},
    	{
    		county: "Hardin County",
    		state: "TX",
    		pop: 57602
    	},
    	{
    		county: "Harris County",
    		state: "TX",
    		pop: 4713325
    	},
    	{
    		county: "Harrison County",
    		state: "TX",
    		pop: 66553
    	},
    	{
    		county: "Hartley County",
    		state: "TX",
    		pop: 5576
    	},
    	{
    		county: "Haskell County",
    		state: "TX",
    		pop: 5658
    	},
    	{
    		county: "Hays County",
    		state: "TX",
    		pop: 230191
    	},
    	{
    		county: "Hemphill County",
    		state: "TX",
    		pop: 3819
    	},
    	{
    		county: "Henderson County",
    		state: "TX",
    		pop: 82737
    	},
    	{
    		county: "Hidalgo County",
    		state: "TX",
    		pop: 868707
    	},
    	{
    		county: "Hill County",
    		state: "TX",
    		pop: 36649
    	},
    	{
    		county: "Hockley County",
    		state: "TX",
    		pop: 23021
    	},
    	{
    		county: "Hood County",
    		state: "TX",
    		pop: 61643
    	},
    	{
    		county: "Hopkins County",
    		state: "TX",
    		pop: 37084
    	},
    	{
    		county: "Houston County",
    		state: "TX",
    		pop: 22968
    	},
    	{
    		county: "Howard County",
    		state: "TX",
    		pop: 36664
    	},
    	{
    		county: "Hudspeth County",
    		state: "TX",
    		pop: 4886
    	},
    	{
    		county: "Hunt County",
    		state: "TX",
    		pop: 98594
    	},
    	{
    		county: "Hutchinson County",
    		state: "TX",
    		pop: 20938
    	},
    	{
    		county: "Irion County",
    		state: "TX",
    		pop: 1536
    	},
    	{
    		county: "Jack County",
    		state: "TX",
    		pop: 8935
    	},
    	{
    		county: "Jackson County",
    		state: "TX",
    		pop: 14760
    	},
    	{
    		county: "Jasper County",
    		state: "TX",
    		pop: 35529
    	},
    	{
    		county: "Jeff Davis County",
    		state: "TX",
    		pop: 2274
    	},
    	{
    		county: "Jefferson County",
    		state: "TX",
    		pop: 251565
    	},
    	{
    		county: "Jim Hogg County",
    		state: "TX",
    		pop: 5200
    	},
    	{
    		county: "Jim Wells County",
    		state: "TX",
    		pop: 40482
    	},
    	{
    		county: "Johnson County",
    		state: "TX",
    		pop: 175817
    	},
    	{
    		county: "Jones County",
    		state: "TX",
    		pop: 20083
    	},
    	{
    		county: "Karnes County",
    		state: "TX",
    		pop: 15601
    	},
    	{
    		county: "Kaufman County",
    		state: "TX",
    		pop: 136154
    	},
    	{
    		county: "Kendall County",
    		state: "TX",
    		pop: 47431
    	},
    	{
    		county: "Kenedy County",
    		state: "TX",
    		pop: 404
    	},
    	{
    		county: "Kent County",
    		state: "TX",
    		pop: 762
    	},
    	{
    		county: "Kerr County",
    		state: "TX",
    		pop: 52600
    	},
    	{
    		county: "Kimble County",
    		state: "TX",
    		pop: 4337
    	},
    	{
    		county: "King County",
    		state: "TX",
    		pop: 272
    	},
    	{
    		county: "Kinney County",
    		state: "TX",
    		pop: 3667
    	},
    	{
    		county: "Kleberg County",
    		state: "TX",
    		pop: 30680
    	},
    	{
    		county: "Knox County",
    		state: "TX",
    		pop: 3664
    	},
    	{
    		county: "Lamar County",
    		state: "TX",
    		pop: 49859
    	},
    	{
    		county: "Lamb County",
    		state: "TX",
    		pop: 12893
    	},
    	{
    		county: "Lampasas County",
    		state: "TX",
    		pop: 21428
    	},
    	{
    		county: "La Salle County",
    		state: "TX",
    		pop: 7520
    	},
    	{
    		county: "Lavaca County",
    		state: "TX",
    		pop: 20154
    	},
    	{
    		county: "Lee County",
    		state: "TX",
    		pop: 17239
    	},
    	{
    		county: "Leon County",
    		state: "TX",
    		pop: 17404
    	},
    	{
    		county: "Liberty County",
    		state: "TX",
    		pop: 88219
    	},
    	{
    		county: "Limestone County",
    		state: "TX",
    		pop: 23437
    	},
    	{
    		county: "Lipscomb County",
    		state: "TX",
    		pop: 3233
    	},
    	{
    		county: "Live Oak County",
    		state: "TX",
    		pop: 12207
    	},
    	{
    		county: "Llano County",
    		state: "TX",
    		pop: 21795
    	},
    	{
    		county: "Loving County",
    		state: "TX",
    		pop: 169
    	},
    	{
    		county: "Lubbock County",
    		state: "TX",
    		pop: 310569
    	},
    	{
    		county: "Lynn County",
    		state: "TX",
    		pop: 5951
    	},
    	{
    		county: "McCulloch County",
    		state: "TX",
    		pop: 7984
    	},
    	{
    		county: "McLennan County",
    		state: "TX",
    		pop: 256623
    	},
    	{
    		county: "McMullen County",
    		state: "TX",
    		pop: 743
    	},
    	{
    		county: "Madison County",
    		state: "TX",
    		pop: 14284
    	},
    	{
    		county: "Marion County",
    		state: "TX",
    		pop: 9854
    	},
    	{
    		county: "Martin County",
    		state: "TX",
    		pop: 5771
    	},
    	{
    		county: "Mason County",
    		state: "TX",
    		pop: 4274
    	},
    	{
    		county: "Matagorda County",
    		state: "TX",
    		pop: 36643
    	},
    	{
    		county: "Maverick County",
    		state: "TX",
    		pop: 58722
    	},
    	{
    		county: "Medina County",
    		state: "TX",
    		pop: 51584
    	},
    	{
    		county: "Menard County",
    		state: "TX",
    		pop: 2138
    	},
    	{
    		county: "Midland County",
    		state: "TX",
    		pop: 176832
    	},
    	{
    		county: "Milam County",
    		state: "TX",
    		pop: 24823
    	},
    	{
    		county: "Mills County",
    		state: "TX",
    		pop: 4873
    	},
    	{
    		county: "Mitchell County",
    		state: "TX",
    		pop: 8545
    	},
    	{
    		county: "Montague County",
    		state: "TX",
    		pop: 19818
    	},
    	{
    		county: "Montgomery County",
    		state: "TX",
    		pop: 607391
    	},
    	{
    		county: "Moore County",
    		state: "TX",
    		pop: 20940
    	},
    	{
    		county: "Morris County",
    		state: "TX",
    		pop: 12388
    	},
    	{
    		county: "Motley County",
    		state: "TX",
    		pop: 1200
    	},
    	{
    		county: "Nacogdoches County",
    		state: "TX",
    		pop: 65204
    	},
    	{
    		county: "Navarro County",
    		state: "TX",
    		pop: 50113
    	},
    	{
    		county: "Newton County",
    		state: "TX",
    		pop: 13595
    	},
    	{
    		county: "Nolan County",
    		state: "TX",
    		pop: 14714
    	},
    	{
    		county: "Nueces County",
    		state: "TX",
    		pop: 362294
    	},
    	{
    		county: "Ochiltree County",
    		state: "TX",
    		pop: 9836
    	},
    	{
    		county: "Oldham County",
    		state: "TX",
    		pop: 2112
    	},
    	{
    		county: "Orange County",
    		state: "TX",
    		pop: 83396
    	},
    	{
    		county: "Palo Pinto County",
    		state: "TX",
    		pop: 29189
    	},
    	{
    		county: "Panola County",
    		state: "TX",
    		pop: 23194
    	},
    	{
    		county: "Parker County",
    		state: "TX",
    		pop: 142878
    	},
    	{
    		county: "Parmer County",
    		state: "TX",
    		pop: 9605
    	},
    	{
    		county: "Pecos County",
    		state: "TX",
    		pop: 15823
    	},
    	{
    		county: "Polk County",
    		state: "TX",
    		pop: 51353
    	},
    	{
    		county: "Potter County",
    		state: "TX",
    		pop: 117415
    	},
    	{
    		county: "Presidio County",
    		state: "TX",
    		pop: 6704
    	},
    	{
    		county: "Rains County",
    		state: "TX",
    		pop: 12514
    	},
    	{
    		county: "Randall County",
    		state: "TX",
    		pop: 137713
    	},
    	{
    		county: "Reagan County",
    		state: "TX",
    		pop: 3849
    	},
    	{
    		county: "Real County",
    		state: "TX",
    		pop: 3452
    	},
    	{
    		county: "Red River County",
    		state: "TX",
    		pop: 12023
    	},
    	{
    		county: "Reeves County",
    		state: "TX",
    		pop: 15976
    	},
    	{
    		county: "Refugio County",
    		state: "TX",
    		pop: 6948
    	},
    	{
    		county: "Roberts County",
    		state: "TX",
    		pop: 854
    	},
    	{
    		county: "Robertson County",
    		state: "TX",
    		pop: 17074
    	},
    	{
    		county: "Rockwall County",
    		state: "TX",
    		pop: 104915
    	},
    	{
    		county: "Runnels County",
    		state: "TX",
    		pop: 10264
    	},
    	{
    		county: "Rusk County",
    		state: "TX",
    		pop: 54406
    	},
    	{
    		county: "Sabine County",
    		state: "TX",
    		pop: 10542
    	},
    	{
    		county: "San Augustine County",
    		state: "TX",
    		pop: 8237
    	},
    	{
    		county: "San Jacinto County",
    		state: "TX",
    		pop: 28859
    	},
    	{
    		county: "San Patricio County",
    		state: "TX",
    		pop: 66730
    	},
    	{
    		county: "San Saba County",
    		state: "TX",
    		pop: 6055
    	},
    	{
    		county: "Schleicher County",
    		state: "TX",
    		pop: 2793
    	},
    	{
    		county: "Scurry County",
    		state: "TX",
    		pop: 16703
    	},
    	{
    		county: "Shackelford County",
    		state: "TX",
    		pop: 3265
    	},
    	{
    		county: "Shelby County",
    		state: "TX",
    		pop: 25274
    	},
    	{
    		county: "Sherman County",
    		state: "TX",
    		pop: 3022
    	},
    	{
    		county: "Smith County",
    		state: "TX",
    		pop: 232751
    	},
    	{
    		county: "Somervell County",
    		state: "TX",
    		pop: 9128
    	},
    	{
    		county: "Starr County",
    		state: "TX",
    		pop: 64633
    	},
    	{
    		county: "Stephens County",
    		state: "TX",
    		pop: 9366
    	},
    	{
    		county: "Sterling County",
    		state: "TX",
    		pop: 1291
    	},
    	{
    		county: "Stonewall County",
    		state: "TX",
    		pop: 1350
    	},
    	{
    		county: "Sutton County",
    		state: "TX",
    		pop: 3776
    	},
    	{
    		county: "Swisher County",
    		state: "TX",
    		pop: 7397
    	},
    	{
    		county: "Tarrant County",
    		state: "TX",
    		pop: 2102515
    	},
    	{
    		county: "Taylor County",
    		state: "TX",
    		pop: 138034
    	},
    	{
    		county: "Terrell County",
    		state: "TX",
    		pop: 776
    	},
    	{
    		county: "Terry County",
    		state: "TX",
    		pop: 12337
    	},
    	{
    		county: "Throckmorton County",
    		state: "TX",
    		pop: 1501
    	},
    	{
    		county: "Titus County",
    		state: "TX",
    		pop: 32750
    	},
    	{
    		county: "Tom Green County",
    		state: "TX",
    		pop: 119200
    	},
    	{
    		county: "Travis County",
    		state: "TX",
    		pop: 1273954
    	},
    	{
    		county: "Trinity County",
    		state: "TX",
    		pop: 14651
    	},
    	{
    		county: "Tyler County",
    		state: "TX",
    		pop: 21672
    	},
    	{
    		county: "Upshur County",
    		state: "TX",
    		pop: 41753
    	},
    	{
    		county: "Upton County",
    		state: "TX",
    		pop: 3657
    	},
    	{
    		county: "Uvalde County",
    		state: "TX",
    		pop: 26741
    	},
    	{
    		county: "Val Verde County",
    		state: "TX",
    		pop: 49025
    	},
    	{
    		county: "Van Zandt County",
    		state: "TX",
    		pop: 56590
    	},
    	{
    		county: "Victoria County",
    		state: "TX",
    		pop: 92084
    	},
    	{
    		county: "Walker County",
    		state: "TX",
    		pop: 72971
    	},
    	{
    		county: "Waller County",
    		state: "TX",
    		pop: 55246
    	},
    	{
    		county: "Ward County",
    		state: "TX",
    		pop: 11998
    	},
    	{
    		county: "Washington County",
    		state: "TX",
    		pop: 35882
    	},
    	{
    		county: "Webb County",
    		state: "TX",
    		pop: 276652
    	},
    	{
    		county: "Wharton County",
    		state: "TX",
    		pop: 41556
    	},
    	{
    		county: "Wheeler County",
    		state: "TX",
    		pop: 5056
    	},
    	{
    		county: "Wichita County",
    		state: "TX",
    		pop: 132230
    	},
    	{
    		county: "Wilbarger County",
    		state: "TX",
    		pop: 12769
    	},
    	{
    		county: "Willacy County",
    		state: "TX",
    		pop: 21358
    	},
    	{
    		county: "Williamson County",
    		state: "TX",
    		pop: 590551
    	},
    	{
    		county: "Wilson County",
    		state: "TX",
    		pop: 51070
    	},
    	{
    		county: "Winkler County",
    		state: "TX",
    		pop: 8010
    	},
    	{
    		county: "Wise County",
    		state: "TX",
    		pop: 69984
    	},
    	{
    		county: "Wood County",
    		state: "TX",
    		pop: 45539
    	},
    	{
    		county: "Yoakum County",
    		state: "TX",
    		pop: 8713
    	},
    	{
    		county: "Young County",
    		state: "TX",
    		pop: 18010
    	},
    	{
    		county: "Zapata County",
    		state: "TX",
    		pop: 14179
    	},
    	{
    		county: "Zavala County",
    		state: "TX",
    		pop: 11840
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "UT",
    		pop: 0
    	},
    	{
    		county: "Beaver County",
    		state: "UT",
    		pop: 6710
    	},
    	{
    		county: "Box Elder County",
    		state: "UT",
    		pop: 56046
    	},
    	{
    		county: "Cache County",
    		state: "UT",
    		pop: 128289
    	},
    	{
    		county: "Carbon County",
    		state: "UT",
    		pop: 20463
    	},
    	{
    		county: "Daggett County",
    		state: "UT",
    		pop: 950
    	},
    	{
    		county: "Davis County",
    		state: "UT",
    		pop: 355481
    	},
    	{
    		county: "Duchesne County",
    		state: "UT",
    		pop: 19938
    	},
    	{
    		county: "Emery County",
    		state: "UT",
    		pop: 10012
    	},
    	{
    		county: "Garfield County",
    		state: "UT",
    		pop: 5051
    	},
    	{
    		county: "Grand County",
    		state: "UT",
    		pop: 9754
    	},
    	{
    		county: "Iron County",
    		state: "UT",
    		pop: 54839
    	},
    	{
    		county: "Juab County",
    		state: "UT",
    		pop: 12017
    	},
    	{
    		county: "Kane County",
    		state: "UT",
    		pop: 7886
    	},
    	{
    		county: "Millard County",
    		state: "UT",
    		pop: 13188
    	},
    	{
    		county: "Morgan County",
    		state: "UT",
    		pop: 12124
    	},
    	{
    		county: "Piute County",
    		state: "UT",
    		pop: 1479
    	},
    	{
    		county: "Rich County",
    		state: "UT",
    		pop: 2483
    	},
    	{
    		county: "Salt Lake County",
    		state: "UT",
    		pop: 1160437
    	},
    	{
    		county: "San Juan County",
    		state: "UT",
    		pop: 15308
    	},
    	{
    		county: "Sanpete County",
    		state: "UT",
    		pop: 30939
    	},
    	{
    		county: "Sevier County",
    		state: "UT",
    		pop: 21620
    	},
    	{
    		county: "Summit County",
    		state: "UT",
    		pop: 42145
    	},
    	{
    		county: "Tooele County",
    		state: "UT",
    		pop: 72259
    	},
    	{
    		county: "Uintah County",
    		state: "UT",
    		pop: 35734
    	},
    	{
    		county: "Utah County",
    		state: "UT",
    		pop: 636235
    	},
    	{
    		county: "Wasatch County",
    		state: "UT",
    		pop: 34091
    	},
    	{
    		county: "Washington County",
    		state: "UT",
    		pop: 177556
    	},
    	{
    		county: "Wayne County",
    		state: "UT",
    		pop: 2711
    	},
    	{
    		county: "Weber County",
    		state: "UT",
    		pop: 260213
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "VT",
    		pop: 0
    	},
    	{
    		county: "Addison County",
    		state: "VT",
    		pop: 36777
    	},
    	{
    		county: "Bennington County",
    		state: "VT",
    		pop: 35470
    	},
    	{
    		county: "Caledonia County",
    		state: "VT",
    		pop: 29993
    	},
    	{
    		county: "Chittenden County",
    		state: "VT",
    		pop: 163774
    	},
    	{
    		county: "Essex County",
    		state: "VT",
    		pop: 6163
    	},
    	{
    		county: "Franklin County",
    		state: "VT",
    		pop: 49402
    	},
    	{
    		county: "Grand Isle County",
    		state: "VT",
    		pop: 7235
    	},
    	{
    		county: "Lamoille County",
    		state: "VT",
    		pop: 25362
    	},
    	{
    		county: "Orange County",
    		state: "VT",
    		pop: 28892
    	},
    	{
    		county: "Orleans County",
    		state: "VT",
    		pop: 27037
    	},
    	{
    		county: "Rutland County",
    		state: "VT",
    		pop: 58191
    	},
    	{
    		county: "Washington County",
    		state: "VT",
    		pop: 58409
    	},
    	{
    		county: "Windham County",
    		state: "VT",
    		pop: 42222
    	},
    	{
    		county: "Windsor County",
    		state: "VT",
    		pop: 55062
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "VA",
    		pop: 0
    	},
    	{
    		county: "Accomack County",
    		state: "VA",
    		pop: 32316
    	},
    	{
    		county: "Albemarle County",
    		state: "VA",
    		pop: 109330
    	},
    	{
    		county: "Alleghany County",
    		state: "VA",
    		pop: 14860
    	},
    	{
    		county: "Amelia County",
    		state: "VA",
    		pop: 13145
    	},
    	{
    		county: "Amherst County",
    		state: "VA",
    		pop: 31605
    	},
    	{
    		county: "Appomattox County",
    		state: "VA",
    		pop: 15911
    	},
    	{
    		county: "Arlington County",
    		state: "VA",
    		pop: 236842
    	},
    	{
    		county: "Augusta County",
    		state: "VA",
    		pop: 75558
    	},
    	{
    		county: "Bath County",
    		state: "VA",
    		pop: 4147
    	},
    	{
    		county: "Bedford County",
    		state: "VA",
    		pop: 78997
    	},
    	{
    		county: "Bland County",
    		state: "VA",
    		pop: 6280
    	},
    	{
    		county: "Botetourt County",
    		state: "VA",
    		pop: 33419
    	},
    	{
    		county: "Brunswick County",
    		state: "VA",
    		pop: 16231
    	},
    	{
    		county: "Buchanan County",
    		state: "VA",
    		pop: 21004
    	},
    	{
    		county: "Buckingham County",
    		state: "VA",
    		pop: 17148
    	},
    	{
    		county: "Campbell County",
    		state: "VA",
    		pop: 54885
    	},
    	{
    		county: "Caroline County",
    		state: "VA",
    		pop: 30725
    	},
    	{
    		county: "Carroll County",
    		state: "VA",
    		pop: 29791
    	},
    	{
    		county: "Charles City County",
    		state: "VA",
    		pop: 6963
    	},
    	{
    		county: "Charlotte County",
    		state: "VA",
    		pop: 11880
    	},
    	{
    		county: "Chesterfield County",
    		state: "VA",
    		pop: 352802
    	},
    	{
    		county: "Clarke County",
    		state: "VA",
    		pop: 14619
    	},
    	{
    		county: "Craig County",
    		state: "VA",
    		pop: 5131
    	},
    	{
    		county: "Culpeper County",
    		state: "VA",
    		pop: 52605
    	},
    	{
    		county: "Cumberland County",
    		state: "VA",
    		pop: 9932
    	},
    	{
    		county: "Dickenson County",
    		state: "VA",
    		pop: 14318
    	},
    	{
    		county: "Dinwiddie County",
    		state: "VA",
    		pop: 28544
    	},
    	{
    		county: "Essex County",
    		state: "VA",
    		pop: 10953
    	},
    	{
    		county: "Fairfax County",
    		state: "VA",
    		pop: 1147532
    	},
    	{
    		county: "Fauquier County",
    		state: "VA",
    		pop: 71222
    	},
    	{
    		county: "Floyd County",
    		state: "VA",
    		pop: 15749
    	},
    	{
    		county: "Fluvanna County",
    		state: "VA",
    		pop: 27270
    	},
    	{
    		county: "Franklin County",
    		state: "VA",
    		pop: 56042
    	},
    	{
    		county: "Frederick County",
    		state: "VA",
    		pop: 89313
    	},
    	{
    		county: "Giles County",
    		state: "VA",
    		pop: 16720
    	},
    	{
    		county: "Gloucester County",
    		state: "VA",
    		pop: 37348
    	},
    	{
    		county: "Goochland County",
    		state: "VA",
    		pop: 23753
    	},
    	{
    		county: "Grayson County",
    		state: "VA",
    		pop: 15550
    	},
    	{
    		county: "Greene County",
    		state: "VA",
    		pop: 19819
    	},
    	{
    		county: "Greensville County",
    		state: "VA",
    		pop: 11336
    	},
    	{
    		county: "Halifax County",
    		state: "VA",
    		pop: 33911
    	},
    	{
    		county: "Hanover County",
    		state: "VA",
    		pop: 107766
    	},
    	{
    		county: "Henrico County",
    		state: "VA",
    		pop: 330818
    	},
    	{
    		county: "Henry County",
    		state: "VA",
    		pop: 50557
    	},
    	{
    		county: "Highland County",
    		state: "VA",
    		pop: 2190
    	},
    	{
    		county: "Isle of Wight County",
    		state: "VA",
    		pop: 37109
    	},
    	{
    		county: "James City County",
    		state: "VA",
    		pop: 76523
    	},
    	{
    		county: "King and Queen County",
    		state: "VA",
    		pop: 7025
    	},
    	{
    		county: "King George County",
    		state: "VA",
    		pop: 26836
    	},
    	{
    		county: "King William County",
    		state: "VA",
    		pop: 17148
    	},
    	{
    		county: "Lancaster County",
    		state: "VA",
    		pop: 10603
    	},
    	{
    		county: "Lee County",
    		state: "VA",
    		pop: 23423
    	},
    	{
    		county: "Loudoun County",
    		state: "VA",
    		pop: 413538
    	},
    	{
    		county: "Louisa County",
    		state: "VA",
    		pop: 37591
    	},
    	{
    		county: "Lunenburg County",
    		state: "VA",
    		pop: 12196
    	},
    	{
    		county: "Madison County",
    		state: "VA",
    		pop: 13261
    	},
    	{
    		county: "Matthews County",
    		state: "VA",
    		pop: 8834
    	},
    	{
    		county: "Mecklenburg County",
    		state: "VA",
    		pop: 30587
    	},
    	{
    		county: "Middlesex County",
    		state: "VA",
    		pop: 10582
    	},
    	{
    		county: "Montgomery County",
    		state: "VA",
    		pop: 98535
    	},
    	{
    		county: "Nelson County",
    		state: "VA",
    		pop: 14930
    	},
    	{
    		county: "New Kent County",
    		state: "VA",
    		pop: 23091
    	},
    	{
    		county: "Northampton County",
    		state: "VA",
    		pop: 11710
    	},
    	{
    		county: "Northumberland County",
    		state: "VA",
    		pop: 12095
    	},
    	{
    		county: "Nottoway County",
    		state: "VA",
    		pop: 15232
    	},
    	{
    		county: "Orange County",
    		state: "VA",
    		pop: 37051
    	},
    	{
    		county: "Page County",
    		state: "VA",
    		pop: 23902
    	},
    	{
    		county: "Patrick County",
    		state: "VA",
    		pop: 17608
    	},
    	{
    		county: "Pittsylvania County",
    		state: "VA",
    		pop: 60354
    	},
    	{
    		county: "Powhatan County",
    		state: "VA",
    		pop: 29652
    	},
    	{
    		county: "Prince Edward County",
    		state: "VA",
    		pop: 22802
    	},
    	{
    		county: "Prince George County",
    		state: "VA",
    		pop: 38353
    	},
    	{
    		county: "Prince William County",
    		state: "VA",
    		pop: 470335
    	},
    	{
    		county: "Pulaski County",
    		state: "VA",
    		pop: 34027
    	},
    	{
    		county: "Rappahannock County",
    		state: "VA",
    		pop: 7370
    	},
    	{
    		county: "Richmond County",
    		state: "VA",
    		pop: 9023
    	},
    	{
    		county: "Roanoke County",
    		state: "VA",
    		pop: 94186
    	},
    	{
    		county: "Rockbridge County",
    		state: "VA",
    		pop: 22573
    	},
    	{
    		county: "Rockingham County",
    		state: "VA",
    		pop: 81948
    	},
    	{
    		county: "Russell County",
    		state: "VA",
    		pop: 26586
    	},
    	{
    		county: "Scott County",
    		state: "VA",
    		pop: 21566
    	},
    	{
    		county: "Shenandoah County",
    		state: "VA",
    		pop: 43616
    	},
    	{
    		county: "Smyth County",
    		state: "VA",
    		pop: 30104
    	},
    	{
    		county: "Southampton County",
    		state: "VA",
    		pop: 17631
    	},
    	{
    		county: "Spotsylvania County",
    		state: "VA",
    		pop: 136215
    	},
    	{
    		county: "Stafford County",
    		state: "VA",
    		pop: 152882
    	},
    	{
    		county: "Surry County",
    		state: "VA",
    		pop: 6422
    	},
    	{
    		county: "Sussex County",
    		state: "VA",
    		pop: 11159
    	},
    	{
    		county: "Tazewell County",
    		state: "VA",
    		pop: 40595
    	},
    	{
    		county: "Warren County",
    		state: "VA",
    		pop: 40164
    	},
    	{
    		county: "Washington County",
    		state: "VA",
    		pop: 53740
    	},
    	{
    		county: "Westmoreland County",
    		state: "VA",
    		pop: 18015
    	},
    	{
    		county: "Wise County",
    		state: "VA",
    		pop: 37383
    	},
    	{
    		county: "Wythe County",
    		state: "VA",
    		pop: 28684
    	},
    	{
    		county: "York County",
    		state: "VA",
    		pop: 68280
    	},
    	{
    		county: "Alexandria City",
    		state: "VA",
    		pop: 159428
    	},
    	{
    		county: "Bristol city",
    		state: "VA",
    		pop: 16762
    	},
    	{
    		county: "Buena Vista city",
    		state: "VA",
    		pop: 6478
    	},
    	{
    		county: "Charlottesville City",
    		state: "VA",
    		pop: 47266
    	},
    	{
    		county: "Chesapeake City",
    		state: "VA",
    		pop: 244835
    	},
    	{
    		county: "Colonial Heights city",
    		state: "VA",
    		pop: 17370
    	},
    	{
    		county: "Covington city",
    		state: "VA",
    		pop: 5538
    	},
    	{
    		county: "Danville City",
    		state: "VA",
    		pop: 40044
    	},
    	{
    		county: "Emporia city",
    		state: "VA",
    		pop: 5346
    	},
    	{
    		county: "Fairfax city",
    		state: "VA",
    		pop: 24019
    	},
    	{
    		county: "Falls Church city",
    		state: "VA",
    		pop: 14617
    	},
    	{
    		county: "Franklin city",
    		state: "VA",
    		pop: 7967
    	},
    	{
    		county: "Fredericksburg City",
    		state: "VA",
    		pop: 29036
    	},
    	{
    		county: "Galax city",
    		state: "VA",
    		pop: 6347
    	},
    	{
    		county: "Hampton city",
    		state: "VA",
    		pop: 134510
    	},
    	{
    		county: "Harrisonburg City",
    		state: "VA",
    		pop: 53016
    	},
    	{
    		county: "Hopewell city",
    		state: "VA",
    		pop: 22529
    	},
    	{
    		county: "Lexington city",
    		state: "VA",
    		pop: 7446
    	},
    	{
    		county: "Lynchburg city",
    		state: "VA",
    		pop: 82168
    	},
    	{
    		county: "Manassas City",
    		state: "VA",
    		pop: 41085
    	},
    	{
    		county: "Manassas Park city",
    		state: "VA",
    		pop: 17478
    	},
    	{
    		county: "Martinsville city",
    		state: "VA",
    		pop: 12554
    	},
    	{
    		county: "Newport News City",
    		state: "VA",
    		pop: 179225
    	},
    	{
    		county: "Norfolk City",
    		state: "VA",
    		pop: 242742
    	},
    	{
    		county: "Norton city",
    		state: "VA",
    		pop: 3981
    	},
    	{
    		county: "Petersburg city",
    		state: "VA",
    		pop: 31346
    	},
    	{
    		county: "Poquoson city",
    		state: "VA",
    		pop: 12271
    	},
    	{
    		county: "Portsmouth City",
    		state: "VA",
    		pop: 94398
    	},
    	{
    		county: "Radford city",
    		state: "VA",
    		pop: 18249
    	},
    	{
    		county: "Richmond City",
    		state: "VA",
    		pop: 230436
    	},
    	{
    		county: "Roanoke city",
    		state: "VA",
    		pop: 99143
    	},
    	{
    		county: "Salem city",
    		state: "VA",
    		pop: 25301
    	},
    	{
    		county: "Staunton city",
    		state: "VA",
    		pop: 24932
    	},
    	{
    		county: "Suffolk City",
    		state: "VA",
    		pop: 92108
    	},
    	{
    		county: "Virginia Beach City",
    		state: "VA",
    		pop: 449974
    	},
    	{
    		county: "Waynesboro city",
    		state: "VA",
    		pop: 22630
    	},
    	{
    		county: "Williamsburg City",
    		state: "VA",
    		pop: 14954
    	},
    	{
    		county: "Winchester city",
    		state: "VA",
    		pop: 28078
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "WA",
    		pop: 0
    	},
    	{
    		county: "Adams County",
    		state: "WA",
    		pop: 19983
    	},
    	{
    		county: "Asotin County",
    		state: "WA",
    		pop: 22582
    	},
    	{
    		county: "Benton County",
    		state: "WA",
    		pop: 204390
    	},
    	{
    		county: "Chelan County",
    		state: "WA",
    		pop: 77200
    	},
    	{
    		county: "Clallam County",
    		state: "WA",
    		pop: 77331
    	},
    	{
    		county: "Clark County",
    		state: "WA",
    		pop: 488241
    	},
    	{
    		county: "Columbia County",
    		state: "WA",
    		pop: 3985
    	},
    	{
    		county: "Cowlitz County",
    		state: "WA",
    		pop: 110593
    	},
    	{
    		county: "Douglas County",
    		state: "WA",
    		pop: 43429
    	},
    	{
    		county: "Ferry County",
    		state: "WA",
    		pop: 7627
    	},
    	{
    		county: "Franklin County",
    		state: "WA",
    		pop: 95222
    	},
    	{
    		county: "Garfield County",
    		state: "WA",
    		pop: 2225
    	},
    	{
    		county: "Grant County",
    		state: "WA",
    		pop: 97733
    	},
    	{
    		county: "Grays Harbor County",
    		state: "WA",
    		pop: 75061
    	},
    	{
    		county: "Island County",
    		state: "WA",
    		pop: 85141
    	},
    	{
    		county: "Jefferson County",
    		state: "WA",
    		pop: 32221
    	},
    	{
    		county: "King County",
    		state: "WA",
    		pop: 2252782
    	},
    	{
    		county: "Kitsap County",
    		state: "WA",
    		pop: 271473
    	},
    	{
    		county: "Kittitas County",
    		state: "WA",
    		pop: 47935
    	},
    	{
    		county: "Klickitat County",
    		state: "WA",
    		pop: 22425
    	},
    	{
    		county: "Lewis County",
    		state: "WA",
    		pop: 80707
    	},
    	{
    		county: "Lincoln County",
    		state: "WA",
    		pop: 10939
    	},
    	{
    		county: "Mason County",
    		state: "WA",
    		pop: 66768
    	},
    	{
    		county: "Okanogan County",
    		state: "WA",
    		pop: 42243
    	},
    	{
    		county: "Pacific County",
    		state: "WA",
    		pop: 22471
    	},
    	{
    		county: "Pend Oreille County",
    		state: "WA",
    		pop: 13724
    	},
    	{
    		county: "Pierce County",
    		state: "WA",
    		pop: 904980
    	},
    	{
    		county: "San Juan County",
    		state: "WA",
    		pop: 17582
    	},
    	{
    		county: "Skagit County",
    		state: "WA",
    		pop: 129205
    	},
    	{
    		county: "Skamania County",
    		state: "WA",
    		pop: 12083
    	},
    	{
    		county: "Snohomish County",
    		state: "WA",
    		pop: 822083
    	},
    	{
    		county: "Spokane County",
    		state: "WA",
    		pop: 522798
    	},
    	{
    		county: "Stevens County",
    		state: "WA",
    		pop: 45723
    	},
    	{
    		county: "Thurston County",
    		state: "WA",
    		pop: 290536
    	},
    	{
    		county: "Wahkiakum County",
    		state: "WA",
    		pop: 4488
    	},
    	{
    		county: "Walla Walla County",
    		state: "WA",
    		pop: 60760
    	},
    	{
    		county: "Whatcom County",
    		state: "WA",
    		pop: 229247
    	},
    	{
    		county: "Whitman County",
    		state: "WA",
    		pop: 50104
    	},
    	{
    		county: "Yakima County",
    		state: "WA",
    		pop: 250873
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "WV",
    		pop: 0
    	},
    	{
    		county: "Barbour County",
    		state: "WV",
    		pop: 16441
    	},
    	{
    		county: "Berkeley County",
    		state: "WV",
    		pop: 119171
    	},
    	{
    		county: "Boone County",
    		state: "WV",
    		pop: 21457
    	},
    	{
    		county: "Braxton County",
    		state: "WV",
    		pop: 13957
    	},
    	{
    		county: "Brooke County",
    		state: "WV",
    		pop: 21939
    	},
    	{
    		county: "Cabell County",
    		state: "WV",
    		pop: 91945
    	},
    	{
    		county: "Calhoun County",
    		state: "WV",
    		pop: 7109
    	},
    	{
    		county: "Clay County",
    		state: "WV",
    		pop: 8508
    	},
    	{
    		county: "Doddridge County",
    		state: "WV",
    		pop: 8448
    	},
    	{
    		county: "Fayette County",
    		state: "WV",
    		pop: 42406
    	},
    	{
    		county: "Gilmer County",
    		state: "WV",
    		pop: 7823
    	},
    	{
    		county: "Grant County",
    		state: "WV",
    		pop: 11568
    	},
    	{
    		county: "Greenbrier County",
    		state: "WV",
    		pop: 34662
    	},
    	{
    		county: "Hampshire County",
    		state: "WV",
    		pop: 23175
    	},
    	{
    		county: "Hancock County",
    		state: "WV",
    		pop: 28810
    	},
    	{
    		county: "Hardy County",
    		state: "WV",
    		pop: 13776
    	},
    	{
    		county: "Harrison County",
    		state: "WV",
    		pop: 67256
    	},
    	{
    		county: "Jackson County",
    		state: "WV",
    		pop: 28576
    	},
    	{
    		county: "Jefferson County",
    		state: "WV",
    		pop: 57146
    	},
    	{
    		county: "Kanawha County",
    		state: "WV",
    		pop: 178124
    	},
    	{
    		county: "Lewis County",
    		state: "WV",
    		pop: 15907
    	},
    	{
    		county: "Lincoln County",
    		state: "WV",
    		pop: 20409
    	},
    	{
    		county: "Logan County",
    		state: "WV",
    		pop: 32019
    	},
    	{
    		county: "McDowell County",
    		state: "WV",
    		pop: 17624
    	},
    	{
    		county: "Marion County",
    		state: "WV",
    		pop: 56072
    	},
    	{
    		county: "Marshall County",
    		state: "WV",
    		pop: 30531
    	},
    	{
    		county: "Mason County",
    		state: "WV",
    		pop: 26516
    	},
    	{
    		county: "Mercer County",
    		state: "WV",
    		pop: 58758
    	},
    	{
    		county: "Mineral County",
    		state: "WV",
    		pop: 26868
    	},
    	{
    		county: "Mingo County",
    		state: "WV",
    		pop: 23424
    	},
    	{
    		county: "Monongalia County",
    		state: "WV",
    		pop: 105612
    	},
    	{
    		county: "Monroe County",
    		state: "WV",
    		pop: 13275
    	},
    	{
    		county: "Morgan County",
    		state: "WV",
    		pop: 17884
    	},
    	{
    		county: "Nicholas County",
    		state: "WV",
    		pop: 24496
    	},
    	{
    		county: "Ohio County",
    		state: "WV",
    		pop: 41411
    	},
    	{
    		county: "Pendleton County",
    		state: "WV",
    		pop: 6969
    	},
    	{
    		county: "Pleasants County",
    		state: "WV",
    		pop: 7460
    	},
    	{
    		county: "Pocahontas County",
    		state: "WV",
    		pop: 8247
    	},
    	{
    		county: "Preston County",
    		state: "WV",
    		pop: 33432
    	},
    	{
    		county: "Putnam County",
    		state: "WV",
    		pop: 56450
    	},
    	{
    		county: "Raleigh County",
    		state: "WV",
    		pop: 73361
    	},
    	{
    		county: "Randolph County",
    		state: "WV",
    		pop: 28695
    	},
    	{
    		county: "Ritchie County",
    		state: "WV",
    		pop: 9554
    	},
    	{
    		county: "Roane County",
    		state: "WV",
    		pop: 13688
    	},
    	{
    		county: "Summers County",
    		state: "WV",
    		pop: 12573
    	},
    	{
    		county: "Taylor County",
    		state: "WV",
    		pop: 16695
    	},
    	{
    		county: "Tucker County",
    		state: "WV",
    		pop: 6839
    	},
    	{
    		county: "Tyler County",
    		state: "WV",
    		pop: 8591
    	},
    	{
    		county: "Upshur County",
    		state: "WV",
    		pop: 24176
    	},
    	{
    		county: "Wayne County",
    		state: "WV",
    		pop: 39402
    	},
    	{
    		county: "Webster County",
    		state: "WV",
    		pop: 8114
    	},
    	{
    		county: "Wetzel County",
    		state: "WV",
    		pop: 15065
    	},
    	{
    		county: "Wirt County",
    		state: "WV",
    		pop: 5821
    	},
    	{
    		county: "Wood County",
    		state: "WV",
    		pop: 83518
    	},
    	{
    		county: "Wyoming County",
    		state: "WV",
    		pop: 20394
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "WI",
    		pop: 0
    	},
    	{
    		county: "Adams County",
    		state: "WI",
    		pop: 20220
    	},
    	{
    		county: "Ashland County",
    		state: "WI",
    		pop: 15562
    	},
    	{
    		county: "Barron County",
    		state: "WI",
    		pop: 45244
    	},
    	{
    		county: "Bayfield County",
    		state: "WI",
    		pop: 15036
    	},
    	{
    		county: "Brown County",
    		state: "WI",
    		pop: 264542
    	},
    	{
    		county: "Buffalo County",
    		state: "WI",
    		pop: 13031
    	},
    	{
    		county: "Burnett County",
    		state: "WI",
    		pop: 15414
    	},
    	{
    		county: "Calumet County",
    		state: "WI",
    		pop: 50089
    	},
    	{
    		county: "Chippewa County",
    		state: "WI",
    		pop: 64658
    	},
    	{
    		county: "Clark County",
    		state: "WI",
    		pop: 34774
    	},
    	{
    		county: "Columbia County",
    		state: "WI",
    		pop: 57532
    	},
    	{
    		county: "Crawford County",
    		state: "WI",
    		pop: 16131
    	},
    	{
    		county: "Dane County",
    		state: "WI",
    		pop: 546695
    	},
    	{
    		county: "Dodge County",
    		state: "WI",
    		pop: 87839
    	},
    	{
    		county: "Door County",
    		state: "WI",
    		pop: 27668
    	},
    	{
    		county: "Douglas County",
    		state: "WI",
    		pop: 43150
    	},
    	{
    		county: "Dunn County",
    		state: "WI",
    		pop: 45368
    	},
    	{
    		county: "Eau Claire County",
    		state: "WI",
    		pop: 104646
    	},
    	{
    		county: "Florence County",
    		state: "WI",
    		pop: 4295
    	},
    	{
    		county: "Fond du Lac County",
    		state: "WI",
    		pop: 103403
    	},
    	{
    		county: "Forest County",
    		state: "WI",
    		pop: 9004
    	},
    	{
    		county: "Grant County",
    		state: "WI",
    		pop: 51439
    	},
    	{
    		county: "Green County",
    		state: "WI",
    		pop: 36960
    	},
    	{
    		county: "Green Lake County",
    		state: "WI",
    		pop: 18913
    	},
    	{
    		county: "Iowa County",
    		state: "WI",
    		pop: 23678
    	},
    	{
    		county: "Iron County",
    		state: "WI",
    		pop: 5687
    	},
    	{
    		county: "Jackson County",
    		state: "WI",
    		pop: 20643
    	},
    	{
    		county: "Jefferson County",
    		state: "WI",
    		pop: 84769
    	},
    	{
    		county: "Juneau County",
    		state: "WI",
    		pop: 26687
    	},
    	{
    		county: "Kenosha County",
    		state: "WI",
    		pop: 169561
    	},
    	{
    		county: "Kewaunee County",
    		state: "WI",
    		pop: 20434
    	},
    	{
    		county: "La Crosse County",
    		state: "WI",
    		pop: 118016
    	},
    	{
    		county: "Lafayette County",
    		state: "WI",
    		pop: 16665
    	},
    	{
    		county: "Langlade County",
    		state: "WI",
    		pop: 19189
    	},
    	{
    		county: "Lincoln County",
    		state: "WI",
    		pop: 27593
    	},
    	{
    		county: "Manitowoc County",
    		state: "WI",
    		pop: 78981
    	},
    	{
    		county: "Marathon County",
    		state: "WI",
    		pop: 135692
    	},
    	{
    		county: "Marinette County",
    		state: "WI",
    		pop: 40350
    	},
    	{
    		county: "Marquette County",
    		state: "WI",
    		pop: 15574
    	},
    	{
    		county: "Menominee County",
    		state: "WI",
    		pop: 4556
    	},
    	{
    		county: "Milwaukee County",
    		state: "WI",
    		pop: 945726
    	},
    	{
    		county: "Monroe County",
    		state: "WI",
    		pop: 46253
    	},
    	{
    		county: "Oconto County",
    		state: "WI",
    		pop: 37930
    	},
    	{
    		county: "Oneida County",
    		state: "WI",
    		pop: 35595
    	},
    	{
    		county: "Outagamie County",
    		state: "WI",
    		pop: 187885
    	},
    	{
    		county: "Ozaukee County",
    		state: "WI",
    		pop: 89221
    	},
    	{
    		county: "Pepin County",
    		state: "WI",
    		pop: 7287
    	},
    	{
    		county: "Pierce County",
    		state: "WI",
    		pop: 42754
    	},
    	{
    		county: "Polk County",
    		state: "WI",
    		pop: 43783
    	},
    	{
    		county: "Portage County",
    		state: "WI",
    		pop: 70772
    	},
    	{
    		county: "Price County",
    		state: "WI",
    		pop: 13351
    	},
    	{
    		county: "Racine County",
    		state: "WI",
    		pop: 196311
    	},
    	{
    		county: "Richland County",
    		state: "WI",
    		pop: 17252
    	},
    	{
    		county: "Rock County",
    		state: "WI",
    		pop: 163354
    	},
    	{
    		county: "Rusk County",
    		state: "WI",
    		pop: 14178
    	},
    	{
    		county: "St. Croix County",
    		state: "WI",
    		pop: 90687
    	},
    	{
    		county: "Sauk County",
    		state: "WI",
    		pop: 64442
    	},
    	{
    		county: "Sawyer County",
    		state: "WI",
    		pop: 16558
    	},
    	{
    		county: "Shawano County",
    		state: "WI",
    		pop: 40899
    	},
    	{
    		county: "Sheboygan County",
    		state: "WI",
    		pop: 115340
    	},
    	{
    		county: "Taylor County",
    		state: "WI",
    		pop: 20343
    	},
    	{
    		county: "Trempealeau County",
    		state: "WI",
    		pop: 29649
    	},
    	{
    		county: "Vernon County",
    		state: "WI",
    		pop: 30822
    	},
    	{
    		county: "Vilas County",
    		state: "WI",
    		pop: 22195
    	},
    	{
    		county: "Walworth County",
    		state: "WI",
    		pop: 103868
    	},
    	{
    		county: "Washburn County",
    		state: "WI",
    		pop: 15720
    	},
    	{
    		county: "Washington County",
    		state: "WI",
    		pop: 136034
    	},
    	{
    		county: "Waukesha County",
    		state: "WI",
    		pop: 404198
    	},
    	{
    		county: "Waupaca County",
    		state: "WI",
    		pop: 50990
    	},
    	{
    		county: "Waushara County",
    		state: "WI",
    		pop: 24443
    	},
    	{
    		county: "Winnebago County",
    		state: "WI",
    		pop: 171907
    	},
    	{
    		county: "Wood County",
    		state: "WI",
    		pop: 72999
    	},
    	{
    		county: "Statewide Unallocated",
    		state: "WY",
    		pop: 0
    	},
    	{
    		county: "Albany County",
    		state: "WY",
    		pop: 38880
    	},
    	{
    		county: "Big Horn County",
    		state: "WY",
    		pop: 11790
    	},
    	{
    		county: "Campbell County",
    		state: "WY",
    		pop: 46341
    	},
    	{
    		county: "Carbon County",
    		state: "WY",
    		pop: 14800
    	},
    	{
    		county: "Converse County",
    		state: "WY",
    		pop: 13822
    	},
    	{
    		county: "Crook County",
    		state: "WY",
    		pop: 7584
    	},
    	{
    		county: "Fremont County",
    		state: "WY",
    		pop: 39261
    	},
    	{
    		county: "Goshen County",
    		state: "WY",
    		pop: 13211
    	},
    	{
    		county: "Hot Springs County",
    		state: "WY",
    		pop: 4413
    	},
    	{
    		county: "Johnson County",
    		state: "WY",
    		pop: 8445
    	},
    	{
    		county: "Laramie County",
    		state: "WY",
    		pop: 99500
    	},
    	{
    		county: "Lincoln County",
    		state: "WY",
    		pop: 19830
    	},
    	{
    		county: "Natrona County",
    		state: "WY",
    		pop: 79858
    	},
    	{
    		county: "Niobrara County",
    		state: "WY",
    		pop: 2356
    	},
    	{
    		county: "Park County",
    		state: "WY",
    		pop: 29194
    	},
    	{
    		county: "Platte County",
    		state: "WY",
    		pop: 8393
    	},
    	{
    		county: "Sheridan County",
    		state: "WY",
    		pop: 30485
    	},
    	{
    		county: "Sublette County",
    		state: "WY",
    		pop: 9831
    	},
    	{
    		county: "Sweetwater County",
    		state: "WY",
    		pop: 42343
    	},
    	{
    		county: "Teton County",
    		state: "WY",
    		pop: 23464
    	},
    	{
    		county: "Uinta County",
    		state: "WY",
    		pop: 20226
    	},
    	{
    		county: "Washakie County",
    		state: "WY",
    		pop: 7805
    	},
    	{
    		county: "Weston County",
    		state: "WY",
    		pop: 6927
    	}
    ];

    function nCr(n, r) {
        return factorial(n) / (factorial(r) * factorial(n - r));
    }
    let memory = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000, 20922789888000];
    function factorial(n) {
        if (n < 0)
            return 0;
        if (n < memory.length)
            return memory[n];
        let result = factorial(n - 1) * n;
        memory[n] = result;
        return result;
    }
    function nWiseArray(n, array) {
        if (array.length < n)
            throw 'array not long enough';
        if (n == array.length)
            return [Array.from(array)];
        if (n == 1)
            return array.map(it => [it]);
        let all = [];
        for (let i = 0; i <= array.length - n; i++) {
            let first = array[i];
            let rest = array.slice(i + 1);
            let result = nWiseArray(n - 1, rest).map(item => [first, ...item]);
            all = all.concat(result);
        }
        if (all.length != nCr(array.length, n))
            throw `${array.length}C${n} should be '${nCr(array.length, n)} - was ${all.length}'`;
        return all;
    }

    let statePopCache = new Map();
    let stateList = null;
    function listStates() {
        if (!stateList) {
            stateList = Array.from(new Set(covidPop.map(item => item.state)));
        }
        return stateList;
    }
    function listCounties(state) {
        return covidPop.filter(it => it.state == state && it.county != "Statewide Unallocated").map(it => it.county);
    }
    function getPop(addr) {
        if (!addr.state && addr.county)
            throw 'must supply state with county';
        if (!addr.state)
            return covidPop.reduce((acum, next) => acum + next.pop, 0);
        if (addr.county) {
            let cty = covidPop.filter(item => item.state == addr.state && item.county == addr.county)[0];
            if (cty)
                return cty.pop;
            return getPop({ state: addr.state });
        }
        if (!statePopCache[addr.state]) {
            let result = covidPop
                .filter(pop => pop.state == addr.state)
                .reduce((acum, next) => acum + next.pop, 0);
            statePopCache[addr.state] = result;
        }
        return statePopCache[addr.state];
    }
    let stateInfectionCache = new Map();
    let overallInfectionAverage = null;
    function getInfectionCount(addr) {
        if (!addr.state && addr.county)
            throw 'must supply state with county';
        if (!addr.state && !addr.county) {
            if (!overallInfectionAverage) {
                overallInfectionAverage = covidInfections.reduce((acum, next) => acum + next.avgInfected, 0) / covidInfections.length;
            }
            return overallInfectionAverage;
        }
        if (addr.county) {
            let cty = covidInfections.filter(item => item.state == addr.state && item.county == addr.county)[0];
            if (cty)
                return cty.avgInfected;
            return getInfectionCount({ state: addr.state });
        }
        if (!stateInfectionCache[addr.state]) {
            let stateEntries = covidInfections
                .filter(item => item.state == addr.state);
            let result = stateEntries
                .reduce((acum, next) => acum + next.avgInfected, 0) / stateEntries.length;
            stateInfectionCache[addr.state] = result;
        }
        return stateInfectionCache[addr.state];
    }
    function getInfectionRate(addr) {
        return getInfectionCount(addr) / getPop(addr);
    }
    function chanceForIndividualToBeInfectedInPast(numDays, addr) {
        return getInfectionRate(addr) * numDays;
    }
    function chanceForHouseholdToBeInfectedInPast(numDays, household) {
        let probOne = chanceForIndividualToBeInfectedInPast(numDays, household.address);
        let combinations = 0;
        for (let i = 1; i <= household.size; i++) {
            let sign = i % 2 == 0 ? -1 : 1;
            combinations += sign * (nCr(household.size, i) * Math.pow(probOne, i));
        }
        return combinations;
    }
    function chanceForHouseholdsToBeInfectedInPast(numDays, households) {
        // TODO: figure this complex shit out
        // List all probabilities - then create all combinations of all sizes. Loop through and combine
        let probs = households.flatMap(h => new Array(h.size).fill(chanceForIndividualToBeInfectedInPast(numDays, h.address)));
        let combinations = 0;
        for (let i = 1; i <= probs.length; i++) {
            let sign = i % 2 == 0 ? -1 : 1;
            combinations += sign * (nWiseArray(i, probs).reduce((acum, next) => acum + next.reduce((acum2, next2) => acum2 * next2, 1), 0));
        }
        return combinations;
    }

    /* src\AddrPicker.svelte generated by Svelte v3.29.7 */
    const file = "src\\AddrPicker.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (21:4) {#each states as state}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*state*/ ctx[9] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*state*/ ctx[9];
    			option.value = option.__value;
    			add_location(option, file, 21, 6, 514);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(21:4) {#each states as state}",
    		ctx
    	});

    	return block;
    }

    // (26:0) {#if addr.state}
    function create_if_block(ctx) {
    	let label;
    	let t;
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*counties*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			t = text("county\r\n    ");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (/*addr*/ ctx[0].county === void 0) add_render_callback(() => /*select_change_handler_1*/ ctx[5].call(select));
    			add_location(select, file, 27, 4, 615);
    			add_location(label, file, 26, 2, 596);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t);
    			append_dev(label, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*addr*/ ctx[0].county);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler_1*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*counties*/ 2) {
    				each_value = /*counties*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*addr, states*/ 5) {
    				select_option(select, /*addr*/ ctx[0].county);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(26:0) {#if addr.state}",
    		ctx
    	});

    	return block;
    }

    // (29:6) {#each counties as county}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*county*/ ctx[6] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*county*/ ctx[6];
    			option.value = option.__value;
    			add_location(option, file, 29, 8, 692);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*counties*/ 2 && t_value !== (t_value = /*county*/ ctx[6] + "")) set_data_dev(t, t_value);

    			if (dirty & /*counties*/ 2 && option_value_value !== (option_value_value = /*county*/ ctx[6])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(29:6) {#each counties as county}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let label;
    	let t0;
    	let select;
    	let t1;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*states*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block = /*addr*/ ctx[0].state && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			label = element("label");
    			t0 = text("state\r\n  ");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			if (/*addr*/ ctx[0].state === void 0) add_render_callback(() => /*select_change_handler*/ ctx[4].call(select));
    			add_location(select, file, 16, 2, 380);
    			add_location(label, file, 15, 0, 364);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t0);
    			append_dev(label, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*addr*/ ctx[0].state);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[4]),
    					listen_dev(select, "change", /*stateSelected*/ ctx[3], false, false, false),
    					listen_dev(select, "blur", /*stateSelected*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*states*/ 4) {
    				each_value_1 = /*states*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*addr, states*/ 5) {
    				select_option(select, /*addr*/ ctx[0].state);
    			}

    			if (/*addr*/ ctx[0].state) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AddrPicker", slots, []);
    	
    	let { addr } = $$props;
    	let states = listStates().sort();
    	addr.state = states[0];
    	let counties = listCounties(addr.state);

    	if (counties) {
    		addr.county = counties[0];
    	}

    	function stateSelected() {
    		$$invalidate(1, counties = listCounties(addr.state));
    		$$invalidate(0, addr.county = counties[0], addr);
    	}

    	const writable_props = ["addr"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AddrPicker> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		addr.state = select_value(this);
    		$$invalidate(0, addr);
    		$$invalidate(2, states);
    	}

    	function select_change_handler_1() {
    		addr.county = select_value(this);
    		$$invalidate(0, addr);
    		$$invalidate(2, states);
    	}

    	$$self.$$set = $$props => {
    		if ("addr" in $$props) $$invalidate(0, addr = $$props.addr);
    	};

    	$$self.$capture_state = () => ({
    		listCounties,
    		listStates,
    		addr,
    		states,
    		counties,
    		stateSelected
    	});

    	$$self.$inject_state = $$props => {
    		if ("addr" in $$props) $$invalidate(0, addr = $$props.addr);
    		if ("states" in $$props) $$invalidate(2, states = $$props.states);
    		if ("counties" in $$props) $$invalidate(1, counties = $$props.counties);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		addr,
    		counties,
    		states,
    		stateSelected,
    		select_change_handler,
    		select_change_handler_1
    	];
    }

    class AddrPicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { addr: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddrPicker",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*addr*/ ctx[0] === undefined && !("addr" in props)) {
    			console.warn("<AddrPicker> was created without expected prop 'addr'");
    		}
    	}

    	get addr() {
    		throw new Error("<AddrPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addr(value) {
    		throw new Error("<AddrPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\HouseholdBuilder.svelte generated by Svelte v3.29.7 */

    const file$1 = "src\\HouseholdBuilder.svelte";

    function create_fragment$1(ctx) {
    	let addrpicker;
    	let updating_addr;
    	let t0;
    	let span;
    	let t1;
    	let t2_value = (chanceForIndividualToBeInfectedInPast(14, /*household*/ ctx[0].address) * 100).toFixed(4) + "";
    	let t2;
    	let t3;
    	let t4;
    	let h3;
    	let t6;
    	let input;
    	let t7;
    	let div;
    	let t8;
    	let t9_value = (chanceForHouseholdToBeInfectedInPast(14, /*household*/ ctx[0]) * 100).toFixed(4) + "";
    	let t9;
    	let t10;
    	let current;
    	let mounted;
    	let dispose;

    	function addrpicker_addr_binding(value) {
    		/*addrpicker_addr_binding*/ ctx[1].call(null, value);
    	}

    	let addrpicker_props = {};

    	if (/*household*/ ctx[0].address !== void 0) {
    		addrpicker_props.addr = /*household*/ ctx[0].address;
    	}

    	addrpicker = new AddrPicker({ props: addrpicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(addrpicker, "addr", addrpicker_addr_binding));

    	const block = {
    		c: function create() {
    			create_component(addrpicker.$$.fragment);
    			t0 = space();
    			span = element("span");
    			t1 = text("Chance of individual being infected in past 14 days\r\n  ");
    			t2 = text(t2_value);
    			t3 = text("%");
    			t4 = space();
    			h3 = element("h3");
    			h3.textContent = "People";
    			t6 = space();
    			input = element("input");
    			t7 = space();
    			div = element("div");
    			t8 = text("Chance of household being infected in past 14 days\r\n  ");
    			t9 = text(t9_value);
    			t10 = text("%");
    			add_location(span, file$1, 7, 0, 255);
    			add_location(h3, file$1, 9, 0, 407);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "min", "1");
    			add_location(input, file$1, 10, 0, 424);
    			add_location(div, file$1, 11, 0, 485);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(addrpicker, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*household*/ ctx[0].size);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t8);
    			append_dev(div, t9);
    			append_dev(div, t10);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const addrpicker_changes = {};

    			if (!updating_addr && dirty & /*household*/ 1) {
    				updating_addr = true;
    				addrpicker_changes.addr = /*household*/ ctx[0].address;
    				add_flush_callback(() => updating_addr = false);
    			}

    			addrpicker.$set(addrpicker_changes);
    			if ((!current || dirty & /*household*/ 1) && t2_value !== (t2_value = (chanceForIndividualToBeInfectedInPast(14, /*household*/ ctx[0].address) * 100).toFixed(4) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*household*/ 1 && to_number(input.value) !== /*household*/ ctx[0].size) {
    				set_input_value(input, /*household*/ ctx[0].size);
    			}

    			if ((!current || dirty & /*household*/ 1) && t9_value !== (t9_value = (chanceForHouseholdToBeInfectedInPast(14, /*household*/ ctx[0]) * 100).toFixed(4) + "")) set_data_dev(t9, t9_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(addrpicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(addrpicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(addrpicker, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HouseholdBuilder", slots, []);
    	
    	let { household } = $$props;
    	const writable_props = ["household"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HouseholdBuilder> was created with unknown prop '${key}'`);
    	});

    	function addrpicker_addr_binding(value) {
    		household.address = value;
    		$$invalidate(0, household);
    	}

    	function input_input_handler() {
    		household.size = to_number(this.value);
    		$$invalidate(0, household);
    	}

    	$$self.$$set = $$props => {
    		if ("household" in $$props) $$invalidate(0, household = $$props.household);
    	};

    	$$self.$capture_state = () => ({
    		AddrPicker,
    		chanceForHouseholdToBeInfectedInPast,
    		chanceForIndividualToBeInfectedInPast,
    		household
    	});

    	$$self.$inject_state = $$props => {
    		if ("household" in $$props) $$invalidate(0, household = $$props.household);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [household, addrpicker_addr_binding, input_input_handler];
    }

    class HouseholdBuilder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { household: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HouseholdBuilder",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*household*/ ctx[0] === undefined && !("household" in props)) {
    			console.warn("<HouseholdBuilder> was created without expected prop 'household'");
    		}
    	}

    	get household() {
    		throw new Error("<HouseholdBuilder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set household(value) {
    		throw new Error("<HouseholdBuilder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.29.7 */
    const file$2 = "src\\App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[4] = list;
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (39:4) {#each households as household}
    function create_each_block$1(ctx) {
    	let li;
    	let householdbuilder;
    	let updating_household;
    	let t;
    	let current;

    	function householdbuilder_household_binding(value) {
    		/*householdbuilder_household_binding*/ ctx[2].call(null, value, /*household*/ ctx[3], /*each_value*/ ctx[4], /*household_index*/ ctx[5]);
    	}

    	let householdbuilder_props = {};

    	if (/*household*/ ctx[3] !== void 0) {
    		householdbuilder_props.household = /*household*/ ctx[3];
    	}

    	householdbuilder = new HouseholdBuilder({
    			props: householdbuilder_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(householdbuilder, "household", householdbuilder_household_binding));

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(householdbuilder.$$.fragment);
    			t = space();
    			add_location(li, file$2, 39, 6, 818);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(householdbuilder, li, null);
    			append_dev(li, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const householdbuilder_changes = {};

    			if (!updating_household && dirty & /*households*/ 1) {
    				updating_household = true;
    				householdbuilder_changes.household = /*household*/ ctx[3];
    				add_flush_callback(() => updating_household = false);
    			}

    			householdbuilder.$set(householdbuilder_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(householdbuilder.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(householdbuilder.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(householdbuilder);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(39:4) {#each households as household}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div;
    	let t2;
    	let t3_value = (chanceForHouseholdsToBeInfectedInPast(14, /*households*/ ctx[0]) * 100).toFixed(3) + "";
    	let t3;
    	let t4;
    	let t5;
    	let h2;
    	let t7;
    	let ul;
    	let t8;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*households*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Deadly Thanksgiving";
    			t1 = space();
    			div = element("div");
    			t2 = text("Chance of any guests being infected within the last 14 days:\n    ");
    			t3 = text(t3_value);
    			t4 = text("%");
    			t5 = space();
    			h2 = element("h2");
    			h2.textContent = "Households";
    			t7 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			button = element("button");
    			button.textContent = "add household";
    			add_location(h1, file$2, 31, 2, 556);
    			add_location(div, file$2, 32, 2, 587);
    			add_location(h2, file$2, 36, 2, 749);
    			add_location(ul, file$2, 37, 2, 771);
    			add_location(button, file$2, 44, 2, 901);
    			attr_dev(main, "class", "svelte-3s85zf");
    			add_location(main, file$2, 30, 0, 547);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    			append_dev(main, t5);
    			append_dev(main, h2);
    			append_dev(main, t7);
    			append_dev(main, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(main, t8);
    			append_dev(main, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*addHousehold*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*households*/ 1) && t3_value !== (t3_value = (chanceForHouseholdsToBeInfectedInPast(14, /*households*/ ctx[0]) * 100).toFixed(3) + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*households*/ 1) {
    				each_value = /*households*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	
    	let households = [{ size: 1, address: {}, name: "Your House" }];

    	function addHousehold() {
    		$$invalidate(0, households = [...households, { size: 1, address: {} }]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function householdbuilder_household_binding(value, household, each_value, household_index) {
    		each_value[household_index] = value;
    		$$invalidate(0, households);
    	}

    	$$self.$capture_state = () => ({
    		HouseholdBuilder,
    		chanceForHouseholdsToBeInfectedInPast,
    		households,
    		addHousehold
    	});

    	$$self.$inject_state = $$props => {
    		if ("households" in $$props) $$invalidate(0, households = $$props.households);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [households, addHousehold, householdbuilder_household_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
