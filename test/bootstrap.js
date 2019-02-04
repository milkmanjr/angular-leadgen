let bootstrap = {};

bootstrap.setup = (t) => {
        bootstrap.LeadService   = window.ang.LeadService;
        bootstrap.ConfigService = window.ang.ConfigService;
        t.end();
};

module.exports = bootstrap;