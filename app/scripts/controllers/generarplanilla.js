'use strict';

/**
 * @ngdoc function
 * @name planillasApp.controller:GenerarplanillaCtrl
 * @description
 * # GenerarplanillaCtrl
 * Controller of the planillasApp
 */
angular.module('planillasApp')
    .controller('GenerarplanillaCtrl', function ($scope, $rootScope, $q, $http, ModelService, $timeout, AuthService, $API, $location, $uibModal) {
        var promises = [
            AuthService.getUser(),
            $rootScope.GF.load_especialidades(),
            $rootScope.GF.load_gradosDocentes(),
            $rootScope.GF.load_unidades_academicas()
        ];
        $scope.nueva_planilla = {};
        $scope.enable_nueva_planilla_fields = {
            especialidad: false
        };

        $scope.filters = {};
        AuthService.getUser().then(function (user) {
            if (!user['gestion']) {
                $location.path('/');
                return;
            }
            $scope.filters['gestion_academica'] = user['gestion']['id'];
        });
        $scope.load_init_params = function () {
            $q.all(promises)
                .then(function (datas) {
                    if (!$rootScope.GF.isSecretaria()) {
                        $scope.$broadcast('active_editable_payroll');
                    } else {
                        $scope.$broadcast('disable_editable_payroll');
                    }
                    var user = datas[0];
                    $scope.nueva_planilla['docente'] = '';
                    $scope.nueva_planilla['materia'] = '';

                    $scope.nueva_planilla['especialidad'] = user['gestion']['especialidad'];
                    $scope.nueva_planilla['gestion_academica'] = user['gestion']['id'];
                    $scope.nueva_planilla['cuenta_bancaria'] = 'CHEQUE';
                    $scope.nueva_planilla['grado'] = $rootScope.GLOBALS.GRADOS_DOCENTE[0].id;
                    $scope.nueva_planilla['tipo'] = $rootScope.GLOBALS.TIPOS_DOCENCIA[0].id;
                    $scope.nueva_planilla['horas_semanales'] = $rootScope.GLOBALS.TIEMPOS_CARGA_HORARIA[0].id;
                    $scope.nueva_planilla['categoria'] = $rootScope.GLOBALS.TIPOS_CATEGORIAS[0].id;
                    $scope.nueva_planilla['reintegro'] = 0;
                    $scope.nueva_planilla['atrasos_periodos'] = 0;
                    $scope.nueva_planilla['factura'] = $rootScope.GLOBALS.FACTURA_ITEMS[1].id;
                    $scope.nueva_planilla['pensul'] = $rootScope.GLOBALS.PENSUL[0].id;
                    $scope.nueva_planilla['habilitado'] = 1;
                    $scope.nueva_planilla['tipo_pago'] = $rootScope.GLOBALS.TIPO_PAGO[0].id;
                    //temporales
                    $scope.nueva_planilla_disabled = {};
                    $scope.tmp = {};
                    //desabilitar
                    if ($rootScope.GF.isAdmin()) {
                        $scope.enable_nueva_planilla_fields.especialidad = true;
                    }
                });
        };
        $scope.load_init_params();

        $scope.refresh_params_nueva_planilla = function () {
            var promises = [$rootScope.GF.load_especialidades(), $rootScope.GF.load_gradosDocentes(), $rootScope.GF.load_unidades_academicas()];
            $q.all(promises).then(function () {
                toastr.clear();
                toastr.success('Datos de entrada acualizados');
            });
        };

        $scope.setInfoDocente = function (docente) {
            var id_docente = docente.id;
            (new $API.Planillas()).$get({
                    docente: id_docente,
                    gestion_academica: $rootScope.CURRENT_USER['gestion']['id'],
                    activo: 1
                })
                .then(function (data) {
                    if (data['data'].length > 0) {
                        var info = data['data'][0];
                        $scope.nueva_planilla_disabled['cuenta_bancaria'] = info['cuenta_bancaria'] ? true : false;
                        $scope.nueva_planilla_disabled['categoria'] = true;
                        $scope.nueva_planilla_disabled['factura'] = true;
                        $scope.nueva_planilla_disabled['grado'] = true;
                        $scope.nueva_planilla_disabled['tipo_pago'] = true;

                        $scope.nueva_planilla['cuenta_bancaria'] = info['cuenta_bancaria'];
                        $scope.nueva_planilla['categoria'] = info['categoria'];
                        $scope.nueva_planilla['factura'] = info['factura'];
                        $scope.nueva_planilla['grado'] = info['grado']['id'];
                    } else {
                        var disabled = ['cuenta_bancaria', 'categoria', 'factura', 'grado', 'pensul', 'tipo_pago'];
                        for (var i = 0; i < disabled.length; i++) {
                            $scope.nueva_planilla_disabled[disabled[i]] = false;
                        }
                    }
                });
        };

        $scope.changeInvoice = function (new_value) {
            if (new_value === 'Si') {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'views/modals/ModalSetInvoice.html',
                    controller: 'ModalSetInvoiceController',
                    size: 'md'
                });
                modalInstance.result.then(function (numero) {
                    $scope.nueva_planilla.numero = numero;
                    console.log(numero);

                }, function (numero) {
                    console.log(numero);
                    $scope.nueva_planilla.factura = $scope.GLOBALS.FACTURA_ITEMS[1].id; // No
                });
            }
        };

        $scope.id_new_payroll_register = 0;

        $scope.guardar_nueva_planilla = function (planilla) {
            (new $API.Planillas()).$create(planilla)
                .then(function (data) {
                    $scope.filters['tipo_pago'] = planilla['tipo_pago'];
                    $scope.filters['docente'] = planilla.docente;
                    $scope.id_new_payroll_register = data.id;
                    toastr.clear();
                    toastr.success('Registro ingresado');
                    $scope.$broadcast('load_planillas_event', $scope.filters);
                }, function () {
                    toastr.warning('No se pudo guardar');
                });
        };

        $scope.general_disable_items = {
            gestion: true,
            periodo_gestion: true
        };
    });

angular.module('planillasApp').controller('ModalSetInvoiceController', function ($scope, $uibModalInstance) {
    $scope.numero = '';
    $scope.ok = function () {
        $uibModalInstance.close($scope.numero);
    };
    $scope.cancel = function () {
        $uibModalInstance.dismiss(false);
    };
});
